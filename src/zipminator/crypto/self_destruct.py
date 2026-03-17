"""Self-destruct module for Zipminator NAV.

This module provides secure data destruction capabilities for sensitive information.
"""

from typing import Optional, List, Union
from pathlib import Path
import os
import shutil
from datetime import datetime, timedelta
import logging


logger = logging.getLogger(__name__)


class SelfDestruct:
    """
    Provides secure data destruction and cleanup functionality.

    This class implements various secure deletion strategies for files,
    directories, and in-memory data structures.
    """

    def __init__(self, log_operations: bool = True) -> None:
        """
        Initialize the SelfDestruct handler.

        Args:
            log_operations: Whether to log destruction operations
        """
        self.log_operations = log_operations
        self.operations_log: List[str] = []

    def secure_delete_file(
        self,
        file_path: Union[str, Path],
        overwrite_passes: int = 3,
        verify: bool = True
    ) -> bool:
        """
        Securely delete a file by overwriting it before deletion.

        Args:
            file_path: Path to the file to delete
            overwrite_passes: Number of times to overwrite the file
            verify: Whether to verify the file is deleted

        Returns:
            True if successfully deleted, False otherwise

        Raises:
            ValueError: If overwrite_passes is less than 1
            FileNotFoundError: If file doesn't exist
        """
        if overwrite_passes < 1:
            raise ValueError("overwrite_passes must be at least 1")

        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        if not file_path.is_file():
            raise ValueError(f"Path is not a file: {file_path}")

        try:
            # Get file size
            file_size = file_path.stat().st_size

            # DoD 5220.22-M style overwrite with configurable pass count
            patterns = [b'\x00', b'\xFF', None]  # None = random data
            for pass_num in range(overwrite_passes):
                pattern = patterns[pass_num % len(patterns)]
                with open(file_path, 'wb') as f:
                    if pattern is None:
                        f.write(os.urandom(file_size))
                    else:
                        f.write(pattern * file_size)
                    f.flush()
                    os.fsync(f.fileno())

            # Delete the file
            file_path.unlink()

            # Verify deletion
            if verify and file_path.exists():
                return False

            if self.log_operations:
                log_msg = f"Securely deleted file: {file_path}"
                self.operations_log.append(f"[{datetime.now().isoformat()}] {log_msg}")
                logger.info(log_msg)

            return True

        except Exception as e:
            logger.error(f"Error securely deleting file {file_path}: {e}")
            raise RuntimeError(f"Failed to securely delete file: {e}") from e

    def secure_delete_directory(
        self,
        dir_path: Union[str, Path],
        recursive: bool = True
    ) -> bool:
        """
        Securely delete a directory and its contents.

        Args:
            dir_path: Path to the directory to delete
            recursive: Whether to delete recursively

        Returns:
            True if successfully deleted, False otherwise

        Raises:
            FileNotFoundError: If directory doesn't exist
        """
        dir_path = Path(dir_path)

        if not dir_path.exists():
            raise FileNotFoundError(f"Directory not found: {dir_path}")

        if not dir_path.is_dir():
            raise ValueError(f"Path is not a directory: {dir_path}")

        try:
            if recursive:
                # Securely delete all files in directory
                for item in dir_path.rglob('*'):
                    if item.is_file():
                        self.secure_delete_file(item)

            # Remove empty directories
            shutil.rmtree(dir_path, ignore_errors=False)

            if self.log_operations:
                log_msg = f"Securely deleted directory: {dir_path}"
                self.operations_log.append(f"[{datetime.now().isoformat()}] {log_msg}")
                logger.info(log_msg)

            return True

        except Exception as e:
            logger.error(f"Error securely deleting directory {dir_path}: {e}")
            raise RuntimeError(f"Failed to securely delete directory: {e}") from e

    def schedule_destruction(
        self,
        path: Union[str, Path],
        delay_hours: int = 24
    ) -> datetime:
        """
        Schedule a file or directory for destruction after a delay.

        Note: This is a placeholder for a full implementation that would
        require a task scheduler or background process.

        Args:
            path: Path to the file or directory
            delay_hours: Hours to wait before destruction

        Returns:
            Scheduled destruction time

        Raises:
            ValueError: If delay_hours is negative
        """
        if delay_hours < 0:
            raise ValueError("delay_hours must be non-negative")

        destruction_time = datetime.now() + timedelta(hours=delay_hours)

        if self.log_operations:
            log_msg = f"Scheduled destruction of {path} for {destruction_time.isoformat()}"
            self.operations_log.append(f"[{datetime.now().isoformat()}] {log_msg}")
            logger.info(log_msg)

        # TODO: Implement actual scheduling mechanism
        # This would require integration with a task scheduler or cron job

        return destruction_time

    def clear_memory(self, data: any) -> None:
        """
        Attempt to clear sensitive data from memory.

        Note: Python's garbage collection makes complete memory clearing difficult.
        This is a best-effort approach.

        Args:
            data: The data structure to clear
        """
        try:
            if isinstance(data, (list, dict, set)):
                data.clear()
            elif isinstance(data, bytearray):
                # Overwrite with zeros
                for i in range(len(data)):
                    data[i] = 0
                data.clear()

            # Force garbage collection
            import gc
            gc.collect()

            if self.log_operations:
                log_msg = f"Cleared memory for {type(data).__name__}"
                self.operations_log.append(f"[{datetime.now().isoformat()}] {log_msg}")
                logger.debug(log_msg)

        except Exception as e:
            logger.error(f"Error clearing memory: {e}")
            raise RuntimeError(f"Failed to clear memory: {e}") from e

    def get_operations_log(self) -> List[str]:
        """
        Get the log of destruction operations.

        Returns:
            List of logged operations
        """
        return self.operations_log.copy()

    def save_operations_log(self, output_file: Union[str, Path]) -> None:
        """
        Save the operations log to a file.

        Args:
            output_file: Path to the output file
        """
        try:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                for log_entry in self.operations_log:
                    f.write(log_entry + '\n')

            logger.info(f"Operations log saved to {output_file}")

        except Exception as e:
            logger.error(f"Error saving operations log: {e}")
            raise RuntimeError(f"Failed to save operations log: {e}") from e
