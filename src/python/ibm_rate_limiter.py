#!/usr/bin/env python3
"""
IBM Quantum Credit Manager and Rate Limiter

Manages IBM Quantum free tier limits (10 minutes/month) with intelligent
scheduling, monitoring, and automatic fallback to classical RNG.

Author: Qdaria QRNG Project
License: MIT
"""

import json
import sqlite3
import time
import yaml
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging


class AlertLevel(Enum):
    """Credit usage alert levels"""
    NORMAL = "normal"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"
    EXHAUSTED = "exhausted"


@dataclass
class JobEstimate:
    """Estimated resource usage for a quantum job"""
    shots: int
    circuits: int
    estimated_runtime_seconds: float
    estimated_minutes: float
    estimated_cost: float = 0.0
    backend: str = "ibm_brisbane"

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class UsageStatus:
    """Current credit usage status"""
    used_minutes: float
    remaining_minutes: float
    max_minutes: float
    percentage_used: float
    alert_level: AlertLevel
    jobs_submitted: int
    last_job_time: Optional[datetime]
    can_submit: bool
    time_until_reset: Optional[timedelta]

    def to_dict(self) -> Dict:
        d = asdict(self)
        d['alert_level'] = self.alert_level.value
        d['last_job_time'] = self.last_job_time.isoformat() if self.last_job_time else None
        d['time_until_reset'] = str(self.time_until_reset) if self.time_until_reset else None
        return d


class IBMCreditManager:
    """
    Manages IBM Quantum credit tracking, rate limiting, and intelligent scheduling
    """

    def __init__(self, config_path: str = "config/ibm_limits.yaml"):
        """
        Initialize credit manager

        Args:
            config_path: Path to configuration file
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()

        # Setup logging
        self._setup_logging()

        # Initialize database
        self.db_path = Path(self.config['tracking']['database']['path'])
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_database()

        # Rate limiting state
        self.last_job_time: Optional[datetime] = None
        self.current_jobs: List[str] = []

        self.logger.info("IBM Credit Manager initialized")

    def _load_config(self) -> Dict:
        """Load configuration from YAML file"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_path}")

        with open(self.config_path, 'r') as f:
            return yaml.safe_load(f)

    def _setup_logging(self):
        """Configure logging"""
        log_path = Path(self.config['monitoring']['notifications']['log_path'])
        log_path.parent.mkdir(parents=True, exist_ok=True)

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_path),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('IBMCreditManager')

    def _init_database(self):
        """Initialize SQLite database for usage tracking"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT UNIQUE,
                    backend TEXT,
                    shots INTEGER,
                    circuits INTEGER,
                    submitted_at TEXT,
                    completed_at TEXT,
                    status TEXT,
                    runtime_seconds REAL,
                    minutes_consumed REAL,
                    queue_time_seconds REAL,
                    entropy_bytes INTEGER,
                    success BOOLEAN
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS usage_summary (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    period_start TEXT,
                    period_end TEXT,
                    total_jobs INTEGER,
                    total_shots INTEGER,
                    total_minutes REAL,
                    total_entropy_bytes INTEGER,
                    average_queue_time REAL,
                    success_rate REAL
                )
            """)

            conn.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    alert_level TEXT,
                    message TEXT,
                    usage_percentage REAL,
                    acknowledged BOOLEAN DEFAULT 0
                )
            """)

            conn.commit()

    def estimate_job(self, shots: int, circuits: int = 1,
                    backend: str = "ibm_brisbane") -> JobEstimate:
        """
        Estimate resource usage for a quantum job

        Args:
            shots: Number of shots
            circuits: Number of circuits
            backend: Target backend

        Returns:
            JobEstimate with resource predictions
        """
        # Get backend speed from config
        speeds = self.config['free_tier']['estimation']['backend_speeds']
        speed = speeds.get(backend, speeds['ibm_brisbane'])

        # Calculate runtime
        execution_time = shots * circuits * speed
        overhead = self.config['free_tier']['estimation']['job_overhead']
        total_runtime = execution_time + overhead

        # Convert to minutes
        minutes = total_runtime / 60.0

        return JobEstimate(
            shots=shots,
            circuits=circuits,
            estimated_runtime_seconds=total_runtime,
            estimated_minutes=minutes,
            backend=backend
        )

    def get_status(self) -> UsageStatus:
        """
        Get current credit usage status

        Returns:
            UsageStatus object with current state
        """
        # Calculate current usage
        used_minutes = self._get_monthly_usage()
        max_minutes = self.config['free_tier']['max_minutes_per_month']
        remaining = max(0, max_minutes - used_minutes)
        percentage = (used_minutes / max_minutes) * 100

        # Determine alert level
        alert_level = self._get_alert_level(percentage)

        # Check if can submit new jobs
        can_submit = self._can_submit_now()

        # Get job count
        jobs_count = self._get_monthly_job_count()

        # Time until reset (first of next month)
        now = datetime.now()
        if now.month == 12:
            next_month = datetime(now.year + 1, 1, 1)
        else:
            next_month = datetime(now.year, now.month + 1, 1)
        time_until_reset = next_month - now

        return UsageStatus(
            used_minutes=used_minutes,
            remaining_minutes=remaining,
            max_minutes=max_minutes,
            percentage_used=percentage,
            alert_level=alert_level,
            jobs_submitted=jobs_count,
            last_job_time=self.last_job_time,
            can_submit=can_submit,
            time_until_reset=time_until_reset
        )

    def can_submit_job(self, estimate: JobEstimate) -> Tuple[bool, str]:
        """
        Check if a job can be submitted based on current limits

        Args:
            estimate: Job estimate

        Returns:
            Tuple of (can_submit, reason)
        """
        status = self.get_status()

        # Check if exhausted
        if status.alert_level == AlertLevel.EXHAUSTED:
            return False, "Monthly credit limit exhausted"

        # Check if would exceed limit
        if status.used_minutes + estimate.estimated_minutes > status.max_minutes:
            return False, f"Job would exceed limit ({estimate.estimated_minutes:.3f} min needed, {status.remaining_minutes:.3f} min available)"

        # Check emergency threshold
        if status.alert_level == AlertLevel.EMERGENCY:
            manual_threshold = self.config['emergency']['manual_approval_threshold_minutes']
            if estimate.estimated_minutes > manual_threshold:
                return False, "Emergency level - manual approval required for large jobs"

        # Check rate limiting
        if not self._can_submit_now():
            return False, f"Rate limit: wait {self._seconds_until_can_submit():.0f} seconds"

        # Check concurrent jobs
        max_concurrent = self.config['free_tier']['rate_limits']['max_concurrent_jobs']
        if len(self.current_jobs) >= max_concurrent:
            return False, f"Maximum concurrent jobs ({max_concurrent}) reached"

        return True, "OK"

    def register_job_submission(self, job_id: str, estimate: JobEstimate) -> None:
        """
        Register a job submission

        Args:
            job_id: IBM job ID
            estimate: Job estimate
        """
        self.last_job_time = datetime.now()
        self.current_jobs.append(job_id)

        # Record in database
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO jobs (job_id, backend, shots, circuits, submitted_at,
                                status, minutes_consumed)
                VALUES (?, ?, ?, ?, ?, 'submitted', ?)
            """, (job_id, estimate.backend, estimate.shots, estimate.circuits,
                  self.last_job_time.isoformat(), estimate.estimated_minutes))
            conn.commit()

        self.logger.info(f"Job {job_id} submitted: {estimate.estimated_minutes:.3f} minutes estimated")

        # Check if should alert
        status = self.get_status()
        self._check_and_alert(status)

    def update_job_completion(self, job_id: str, runtime_seconds: float,
                             success: bool, entropy_bytes: int = 0) -> None:
        """
        Update job completion information

        Args:
            job_id: IBM job ID
            runtime_seconds: Actual runtime
            success: Whether job succeeded
            entropy_bytes: Bytes of entropy generated
        """
        minutes_consumed = runtime_seconds / 60.0
        completed_at = datetime.now()

        # Remove from current jobs
        if job_id in self.current_jobs:
            self.current_jobs.remove(job_id)

        # Update database
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE jobs
                SET completed_at = ?, status = ?, runtime_seconds = ?,
                    minutes_consumed = ?, success = ?, entropy_bytes = ?
                WHERE job_id = ?
            """, (completed_at.isoformat(), 'completed' if success else 'failed',
                  runtime_seconds, minutes_consumed, success, entropy_bytes, job_id))
            conn.commit()

        self.logger.info(f"Job {job_id} completed: {minutes_consumed:.3f} minutes consumed")

    def get_historical_usage(self, days: int = 30) -> List[Dict]:
        """
        Get historical usage data

        Args:
            days: Number of days to retrieve

        Returns:
            List of daily usage summaries
        """
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT DATE(submitted_at) as date,
                       COUNT(*) as jobs,
                       SUM(shots) as total_shots,
                       SUM(minutes_consumed) as total_minutes,
                       SUM(entropy_bytes) as total_entropy,
                       AVG(queue_time_seconds) as avg_queue_time,
                       SUM(CASE WHEN success THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as success_rate
                FROM jobs
                WHERE submitted_at >= ?
                GROUP BY DATE(submitted_at)
                ORDER BY date DESC
            """, (cutoff,))

            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get_best_submission_window(self) -> Optional[datetime]:
        """
        Determine the best time to submit next job based on historical patterns

        Returns:
            Recommended submission time or None for immediate submission
        """
        now = datetime.now()
        current_hour = now.hour

        # Check preferred windows
        for window in self.config['scheduling']['preferred_windows']:
            start_hour = int(window['start'].split(':')[0])
            end_hour = int(window['end'].split(':')[0])

            if start_hour <= current_hour < end_hour:
                return None  # We're in a preferred window, submit now

        # Find next preferred window
        next_window = None
        min_wait = float('inf')

        for window in self.config['scheduling']['preferred_windows']:
            start_hour = int(window['start'].split(':')[0])

            # Calculate hours until this window
            hours_until = (start_hour - current_hour) % 24

            if hours_until < min_wait:
                min_wait = hours_until
                target = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
                if hours_until > 0:
                    target += timedelta(days=1)
                next_window = target

        return next_window

    def _get_monthly_usage(self) -> float:
        """Get total minutes used this month"""
        now = datetime.now()
        month_start = datetime(now.year, now.month, 1).isoformat()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT COALESCE(SUM(minutes_consumed), 0)
                FROM jobs
                WHERE submitted_at >= ?
            """, (month_start,))
            return cursor.fetchone()[0]

    def _get_monthly_job_count(self) -> int:
        """Get total jobs submitted this month"""
        now = datetime.now()
        month_start = datetime(now.year, now.month, 1).isoformat()

        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT COUNT(*)
                FROM jobs
                WHERE submitted_at >= ?
            """, (month_start,))
            return cursor.fetchone()[0]

    def _get_alert_level(self, percentage: float) -> AlertLevel:
        """Determine alert level from usage percentage"""
        if percentage >= 100:
            return AlertLevel.EXHAUSTED

        thresholds = self.config['free_tier']['alert_thresholds']
        if percentage >= thresholds['emergency']:
            return AlertLevel.EMERGENCY
        elif percentage >= thresholds['critical']:
            return AlertLevel.CRITICAL
        elif percentage >= thresholds['warning']:
            return AlertLevel.WARNING
        else:
            return AlertLevel.NORMAL

    def _can_submit_now(self) -> bool:
        """Check if rate limiting allows submission now"""
        if self.last_job_time is None:
            return True

        min_interval = self.config['free_tier']['rate_limits']['min_job_interval_seconds']
        elapsed = (datetime.now() - self.last_job_time).total_seconds()

        return elapsed >= min_interval

    def _seconds_until_can_submit(self) -> float:
        """Get seconds until can submit next job"""
        if self.last_job_time is None:
            return 0

        min_interval = self.config['free_tier']['rate_limits']['min_job_interval_seconds']
        elapsed = (datetime.now() - self.last_job_time).total_seconds()

        return max(0, min_interval - elapsed)

    def _check_and_alert(self, status: UsageStatus) -> None:
        """Check status and create alerts if needed"""
        if status.alert_level in [AlertLevel.WARNING, AlertLevel.CRITICAL,
                                  AlertLevel.EMERGENCY, AlertLevel.EXHAUSTED]:
            message = f"IBM Quantum credit usage at {status.percentage_used:.1f}% ({status.alert_level.value})"

            # Log alert
            self.logger.warning(message)

            # Store in database
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO alerts (timestamp, alert_level, message, usage_percentage)
                    VALUES (?, ?, ?, ?)
                """, (datetime.now().isoformat(), status.alert_level.value,
                      message, status.percentage_used))
                conn.commit()

    def export_metrics(self) -> Dict:
        """
        Export metrics in Prometheus format

        Returns:
            Dictionary of metrics
        """
        status = self.get_status()

        return {
            'ibm_quantum_credits_used_minutes': status.used_minutes,
            'ibm_quantum_credits_remaining_minutes': status.remaining_minutes,
            'ibm_quantum_credits_percentage_used': status.percentage_used,
            'ibm_quantum_jobs_submitted_total': status.jobs_submitted,
            'ibm_quantum_jobs_in_queue': len(self.current_jobs),
            'ibm_quantum_alert_level': ['normal', 'warning', 'critical',
                                        'emergency', 'exhausted'].index(status.alert_level.value),
            'ibm_quantum_can_submit': 1 if status.can_submit else 0,
        }


if __name__ == "__main__":
    # Example usage
    manager = IBMCreditManager()

    # Get current status
    status = manager.get_status()
    print(f"\nIBM Quantum Credit Status:")
    print(f"Used: {status.used_minutes:.3f} / {status.max_minutes} minutes ({status.percentage_used:.1f}%)")
    print(f"Remaining: {status.remaining_minutes:.3f} minutes")
    print(f"Alert Level: {status.alert_level.value}")
    print(f"Can Submit: {status.can_submit}")
    print(f"Jobs This Month: {status.jobs_submitted}")

    # Estimate a job
    estimate = manager.estimate_job(shots=4096, circuits=1)
    print(f"\nJob Estimate (4096 shots):")
    print(f"Estimated Runtime: {estimate.estimated_runtime_seconds:.1f} seconds")
    print(f"Estimated Minutes: {estimate.estimated_minutes:.3f} minutes")

    # Check if can submit
    can_submit, reason = manager.can_submit_job(estimate)
    print(f"Can Submit: {can_submit} - {reason}")

    # Get best submission window
    best_time = manager.get_best_submission_window()
    if best_time:
        print(f"Best Submission Time: {best_time}")
    else:
        print("Best Submission Time: Now (in preferred window)")
