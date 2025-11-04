#!/usr/bin/env python3
"""
IBM Quantum Intelligent Scheduler

Optimizes quantum job scheduling based on:
- Backend availability and queue depth
- Historical performance patterns
- Credit budget constraints
- Time window preferences

Author: Qdaria QRNG Project
License: MIT
"""

import argparse
import json
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "python"))

try:
    from ibm_rate_limiter import IBMCreditManager, JobEstimate, AlertLevel
except ImportError:
    print("Error: ibm_rate_limiter.py not found. Run from project root.", file=sys.stderr)
    sys.exit(1)


class SchedulingPriority:
    """Priority levels for scheduled jobs"""
    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


class ScheduledJob:
    """Represents a scheduled quantum job"""

    def __init__(self, name: str, estimate: JobEstimate, priority: int = SchedulingPriority.MEDIUM):
        self.name = name
        self.estimate = estimate
        self.priority = priority
        self.scheduled_time: Optional[datetime] = None
        self.submitted = False
        self.job_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'estimate': self.estimate.to_dict(),
            'priority': self.priority,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'submitted': self.submitted,
            'job_id': self.job_id
        }


class IBMQuantumScheduler:
    """
    Intelligent scheduler for IBM Quantum jobs
    """

    def __init__(self, config_path: str = "config/ibm_limits.yaml"):
        """Initialize scheduler with credit manager"""
        self.credit_manager = IBMCreditManager(config_path)
        self.config = self.credit_manager.config

        self.scheduled_jobs: List[ScheduledJob] = []

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('IBMScheduler')

    def schedule_job(self, name: str, shots: int, circuits: int = 1,
                    backend: str = "ibm_brisbane",
                    priority: int = SchedulingPriority.MEDIUM) -> ScheduledJob:
        """
        Schedule a quantum job

        Args:
            name: Job name/description
            shots: Number of shots
            circuits: Number of circuits
            backend: Target backend
            priority: Job priority

        Returns:
            ScheduledJob object
        """
        # Create estimate
        estimate = self.credit_manager.estimate_job(shots, circuits, backend)

        # Create scheduled job
        job = ScheduledJob(name, estimate, priority)

        # Determine best submission time
        scheduled_time = self._find_optimal_time(estimate, priority)
        job.scheduled_time = scheduled_time

        # Add to schedule
        self.scheduled_jobs.append(job)

        self.logger.info(f"Scheduled job '{name}': {shots} shots, "
                        f"{estimate.estimated_minutes:.3f} minutes, "
                        f"scheduled for {scheduled_time}")

        return job

    def _find_optimal_time(self, estimate: JobEstimate,
                          priority: int) -> datetime:
        """
        Find optimal submission time for a job

        Args:
            estimate: Job estimate
            priority: Job priority

        Returns:
            Optimal datetime for submission
        """
        now = datetime.now()
        status = self.credit_manager.get_status()

        # Critical priority: submit ASAP if possible
        if priority == SchedulingPriority.CRITICAL:
            if status.alert_level != AlertLevel.EXHAUSTED:
                return now

        # Check if in emergency mode
        if status.alert_level in [AlertLevel.EMERGENCY, AlertLevel.EXHAUSTED]:
            # Wait until next month unless critical
            if priority != SchedulingPriority.CRITICAL:
                if now.month == 12:
                    next_month = datetime(now.year + 1, 1, 1, 2, 0)  # 2 AM on 1st
                else:
                    next_month = datetime(now.year, now.month + 1, 1, 2, 0)
                return next_month

        # Get best submission window
        window_time = self.credit_manager.get_best_submission_window()

        if window_time is None:
            # We're in a good window, check rate limiting
            if self.credit_manager._can_submit_now():
                return now
            else:
                # Wait for rate limit
                wait_seconds = self.credit_manager._seconds_until_can_submit()
                return now + timedelta(seconds=wait_seconds)
        else:
            # Schedule for next preferred window
            return window_time

    def get_schedule(self, include_submitted: bool = False) -> List[ScheduledJob]:
        """
        Get current schedule

        Args:
            include_submitted: Include already submitted jobs

        Returns:
            List of scheduled jobs
        """
        if include_submitted:
            return self.scheduled_jobs
        else:
            return [job for job in self.scheduled_jobs if not job.submitted]

    def process_schedule(self, dry_run: bool = False) -> List[ScheduledJob]:
        """
        Process scheduled jobs, submitting those ready

        Args:
            dry_run: Don't actually submit, just report

        Returns:
            List of submitted jobs
        """
        now = datetime.now()
        submitted = []

        # Sort by scheduled time and priority
        pending = sorted(
            [j for j in self.scheduled_jobs if not j.submitted],
            key=lambda j: (j.scheduled_time, -j.priority)
        )

        for job in pending:
            # Check if time to submit
            if job.scheduled_time and job.scheduled_time > now:
                continue

            # Check if can submit
            can_submit, reason = self.credit_manager.can_submit_job(job.estimate)

            if not can_submit:
                self.logger.warning(f"Cannot submit job '{job.name}': {reason}")
                # Reschedule
                job.scheduled_time = self._find_optimal_time(job.estimate, job.priority)
                self.logger.info(f"Rescheduled '{job.name}' for {job.scheduled_time}")
                continue

            if dry_run:
                self.logger.info(f"[DRY RUN] Would submit job '{job.name}'")
                submitted.append(job)
            else:
                # Actual submission would happen here with IBM API
                # For now, just mark as submitted
                job_id = f"sim_{int(time.time())}_{len(submitted)}"
                job.job_id = job_id
                job.submitted = True

                self.credit_manager.register_job_submission(job_id, job.estimate)

                self.logger.info(f"Submitted job '{job.name}' with ID {job_id}")
                submitted.append(job)

        return submitted

    def batch_requests(self, requests: List[Tuple[int, int]]) -> ScheduledJob:
        """
        Batch multiple small requests into one job

        Args:
            requests: List of (shots, circuits) tuples

        Returns:
            Combined scheduled job
        """
        total_shots = sum(shots for shots, _ in requests)
        total_circuits = sum(circuits for _, circuits in requests)

        name = f"Batched job ({len(requests)} requests)"

        return self.schedule_job(
            name=name,
            shots=total_shots,
            circuits=total_circuits,
            priority=SchedulingPriority.LOW
        )

    def get_queue_status(self) -> Dict:
        """
        Get current queue status

        Returns:
            Dictionary with queue statistics
        """
        pending = [j for j in self.scheduled_jobs if not j.submitted]
        submitted = [j for j in self.scheduled_jobs if j.submitted]

        total_pending_minutes = sum(j.estimate.estimated_minutes for j in pending)
        total_pending_shots = sum(j.estimate.shots for j in pending)

        status = self.credit_manager.get_status()

        return {
            'pending_jobs': len(pending),
            'submitted_jobs': len(submitted),
            'total_pending_minutes': total_pending_minutes,
            'total_pending_shots': total_pending_shots,
            'can_submit': status.can_submit,
            'credits_remaining': status.remaining_minutes,
            'next_job_time': min((j.scheduled_time for j in pending), default=None),
            'alert_level': status.alert_level.value
        }

    def optimize_schedule(self) -> int:
        """
        Optimize current schedule by batching and rescheduling

        Returns:
            Number of jobs optimized
        """
        pending = [j for j in self.scheduled_jobs if not j.submitted]

        # Group low-priority jobs for batching
        low_priority = [j for j in pending if j.priority == SchedulingPriority.LOW]

        if len(low_priority) >= 2 and self.config['scheduling']['batching']['enabled']:
            # Batch low priority jobs
            requests = [(j.estimate.shots, j.estimate.circuits) for j in low_priority]

            # Remove individual jobs
            for job in low_priority:
                self.scheduled_jobs.remove(job)

            # Add batched job
            self.batch_requests(requests)

            self.logger.info(f"Batched {len(low_priority)} low-priority jobs")
            return len(low_priority)

        return 0

    def export_schedule(self, filepath: str) -> None:
        """
        Export schedule to JSON file

        Args:
            filepath: Output file path
        """
        data = {
            'exported_at': datetime.now().isoformat(),
            'jobs': [job.to_dict() for job in self.scheduled_jobs],
            'queue_status': self.get_queue_status()
        }

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        self.logger.info(f"Schedule exported to {filepath}")


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='IBM Quantum Intelligent Scheduler',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Schedule a job
  %(prog)s --schedule "entropy_harvest" --shots 4096 --priority high

  # Process pending jobs
  %(prog)s --process

  # Show queue status
  %(prog)s --status

  # Optimize schedule
  %(prog)s --optimize

  # Export schedule
  %(prog)s --export schedule.json
        """
    )

    parser.add_argument('--schedule', metavar='NAME', help='Schedule a new job')
    parser.add_argument('--shots', type=int, default=4096, help='Number of shots (default: 4096)')
    parser.add_argument('--circuits', type=int, default=1, help='Number of circuits (default: 1)')
    parser.add_argument('--backend', default='ibm_brisbane', help='Target backend (default: ibm_brisbane)')
    parser.add_argument('--priority', choices=['low', 'medium', 'high', 'critical'],
                       default='medium', help='Job priority (default: medium)')

    parser.add_argument('--process', action='store_true', help='Process pending jobs')
    parser.add_argument('--dry-run', action='store_true', help='Dry run mode (no actual submission)')
    parser.add_argument('--status', action='store_true', help='Show queue status')
    parser.add_argument('--optimize', action='store_true', help='Optimize schedule')
    parser.add_argument('--export', metavar='FILE', help='Export schedule to JSON')

    parser.add_argument('--config', default='config/ibm_limits.yaml',
                       help='Config file path (default: config/ibm_limits.yaml)')

    args = parser.parse_args()

    # Initialize scheduler
    scheduler = IBMQuantumScheduler(args.config)

    # Schedule new job
    if args.schedule:
        priority_map = {
            'low': SchedulingPriority.LOW,
            'medium': SchedulingPriority.MEDIUM,
            'high': SchedulingPriority.HIGH,
            'critical': SchedulingPriority.CRITICAL
        }

        job = scheduler.schedule_job(
            name=args.schedule,
            shots=args.shots,
            circuits=args.circuits,
            backend=args.backend,
            priority=priority_map[args.priority]
        )

        print(f"\nJob scheduled:")
        print(json.dumps(job.to_dict(), indent=2))

    # Process schedule
    if args.process:
        submitted = scheduler.process_schedule(dry_run=args.dry_run)
        print(f"\nProcessed {len(submitted)} jobs:")
        for job in submitted:
            print(f"  - {job.name}: {job.job_id}")

    # Optimize
    if args.optimize:
        count = scheduler.optimize_schedule()
        print(f"\nOptimized {count} jobs")

    # Show status
    if args.status or not any([args.schedule, args.process, args.optimize, args.export]):
        status = scheduler.get_queue_status()
        print("\nQueue Status:")
        print(json.dumps(status, indent=2, default=str))

    # Export
    if args.export:
        scheduler.export_schedule(args.export)
        print(f"\nSchedule exported to {args.export}")


if __name__ == "__main__":
    main()
