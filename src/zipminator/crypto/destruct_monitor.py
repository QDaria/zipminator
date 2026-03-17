#!/usr/bin/env python3
"""
Self-Destruct Monitor Service
Runs as background process to enforce time-based file deletion

This service monitors metadata files created during encryption and automatically
destroys files when their self-destruct timer expires, even if the original
Python process is no longer running.

Usage:
    python destruct_monitor.py [watch_directory]

    Default watch directory is current directory (.)
"""

import json
import time
import os
import sys
from pathlib import Path
from datetime import datetime


class DestructMonitor:
    """Monitor and enforce self-destruct timers for encrypted files"""

    def __init__(self, watch_dir='.'):
        """
        Initialize the monitor

        Args:
            watch_dir (str): Directory to watch for metadata files
        """
        self.watch_dir = Path(watch_dir).resolve()
        self.check_interval = 60  # Check every 60 seconds
        print(f"🤖 Self-Destruct Monitor initialized")
        print(f"📂 Watching directory: {self.watch_dir}")

    def check_and_destroy(self):
        """
        Check all metadata files and destroy expired ones

        Scans for *.metadata.json files in the watch directory and checks
        if their self-destruct time has passed. If so, destroys the file
        and removes the metadata.
        """
        current_time = time.time()
        destroyed_count = 0

        for metadata_file in self.watch_dir.glob('*.metadata.json'):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)

                if not metadata.get('self_destruct_enabled'):
                    continue

                destruct_time = metadata.get('self_destruct_at')
                if destruct_time is None:
                    print(f"⚠️  Metadata file {metadata_file} missing self_destruct_at field")
                    continue

                # Check if time has expired
                if current_time >= destruct_time:
                    # Time's up! Destroy file
                    zip_file = self.watch_dir / metadata['file']

                    if zip_file.exists():
                        # Remove the encrypted file
                        os.remove(zip_file)
                        print(f"💥 SELF-DESTRUCT: Destroyed {zip_file}")
                        destroyed_count += 1
                    else:
                        print(f"⚠️  File {zip_file} already deleted")

                    # Remove metadata
                    os.remove(metadata_file)
                    print(f"🗑️  Removed metadata {metadata_file}")
                else:
                    # Calculate remaining time
                    remaining = destruct_time - current_time
                    hours = int(remaining // 3600)
                    minutes = int((remaining % 3600) // 60)
                    seconds = int(remaining % 60)
                    print(f"⏳ {metadata['file']}: {hours}h {minutes}m {seconds}s remaining")

            except json.JSONDecodeError as e:
                print(f"❌ Error parsing {metadata_file}: {e}")
            except KeyError as e:
                print(f"❌ Missing field in {metadata_file}: {e}")
            except Exception as e:
                print(f"❌ Error processing {metadata_file}: {e}")

        if destroyed_count > 0:
            print(f"✅ Destroyed {destroyed_count} file(s) in this cycle")

    def run_daemon(self):
        """
        Run as background daemon

        Continuously monitors the directory and checks for expired files
        at regular intervals. Press Ctrl+C to stop.
        """
        print("=" * 60)
        print("🚀 Self-Destruct Monitor Service Started")
        print(f"⏱️  Check interval: {self.check_interval} seconds")
        print("Press Ctrl+C to stop")
        print("=" * 60)

        try:
            while True:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"\n[{timestamp}] Running check cycle...")
                self.check_and_destroy()

                print(f"💤 Sleeping for {self.check_interval} seconds...")
                time.sleep(self.check_interval)

        except KeyboardInterrupt:
            print("\n\n⏹️  Monitor stopped by user")
            sys.exit(0)
        except Exception as e:
            print(f"\n\n❌ Fatal error: {e}")
            sys.exit(1)


def main():
    """Main entry point for the monitor service"""
    # Get watch directory from command line or use current directory
    watch_dir = sys.argv[1] if len(sys.argv) > 1 else '.'

    # Create and run monitor
    monitor = DestructMonitor(watch_dir)
    monitor.run_daemon()


if __name__ == '__main__':
    main()
