"""Audit trail module for Zipminator NAV."""

from typing import List, Optional
from pathlib import Path
from datetime import datetime
import json


class AuditTrail:
    """Manages audit trail logging for NAV operations."""

    def __init__(self) -> None:
        """Initialize the audit trail with an empty log list."""
        self.audit_trail: List[str] = []

    def add_log(self, log: str, timestamp: bool = True) -> None:
        """
        Add a log entry to the audit trail.

        Args:
            log: The log message to add
            timestamp: Whether to prepend a timestamp to the log entry

        Raises:
            TypeError: If log is not a string
        """
        if not isinstance(log, str):
            raise TypeError(f"Log must be a string, got {type(log).__name__}")

        try:
            if timestamp:
                timestamp_str = datetime.now().isoformat()
                log_entry = f"[{timestamp_str}] {log}"
            else:
                log_entry = log

            self.audit_trail.append(log_entry)
        except Exception as e:
            raise RuntimeError(f"Error adding log entry: {e}") from e

    def save_logs(self, file_name: str, format: str = 'txt') -> None:
        """
        Save audit trail logs to a file.

        Args:
            file_name: The path to the output file
            format: Output format ('txt' or 'json')

        Raises:
            ValueError: If format is not supported
            IOError: If file cannot be written
        """
        if format not in ['txt', 'json']:
            raise ValueError(f"Unsupported format: {format}. Use 'txt' or 'json'.")

        try:
            file_path = Path(file_name)
            file_path.parent.mkdir(parents=True, exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                if format == 'json':
                    json.dump({
                        'audit_trail': self.audit_trail,
                        'count': len(self.audit_trail),
                        'generated': datetime.now().isoformat()
                    }, f, indent=2)
                else:  # txt format
                    for log in self.audit_trail:
                        f.write(log + '\n')
        except IOError as e:
            raise IOError(f"Error saving logs to {file_name}: {e}") from e
        except Exception as e:
            raise RuntimeError(f"Unexpected error saving logs: {e}") from e

    def clear_logs(self) -> None:
        """Clear all logs from the audit trail."""
        self.audit_trail.clear()

    def get_logs(self) -> List[str]:
        """
        Get all logs in the audit trail.

        Returns:
            A copy of the audit trail list
        """
        return self.audit_trail.copy()

    def __len__(self) -> int:
        """Return the number of log entries."""
        return len(self.audit_trail)
