"""Compliance checking module for Zipminator NAV."""

from typing import Callable, List, Optional, Dict, Any, Union
import pandas as pd


class ComplianceCheck:
    """Manages compliance rule checking for DataFrame operations."""

    def __init__(self, rules: Optional[List[Callable[[pd.DataFrame], bool]]] = None) -> None:
        """
        Initialize the compliance checker with optional rules.

        Args:
            rules: Optional list of rule functions that take a DataFrame and return bool
        """
        self.rules: List[Callable[[pd.DataFrame], bool]] = [] if rules is None else rules
        self.last_check_results: Dict[str, Any] = {}

    def add_rule(self, rule: Callable[[pd.DataFrame], bool], name: Optional[str] = None) -> None:
        """
        Add a compliance rule to the checker.

        Args:
            rule: A callable that takes a DataFrame and returns True if compliant
            name: Optional name for the rule (for debugging)

        Raises:
            TypeError: If rule is not callable
        """
        if not callable(rule):
            raise TypeError(f"Rule must be callable, got {type(rule).__name__}")

        try:
            self.rules.append(rule)
            if name:
                # Store rule metadata for debugging
                if not hasattr(self, '_rule_names'):
                    self._rule_names = {}
                self._rule_names[len(self.rules) - 1] = name
        except Exception as e:
            raise RuntimeError(f"Error adding rule: {e}") from e

    def check(self, df: pd.DataFrame, return_details: bool = False) -> Union[bool, Dict[str, Any]]:
        """
        Check all compliance rules against a DataFrame.

        Args:
            df: The DataFrame to check
            return_details: If True, return detailed results for each rule

        Returns:
            Boolean indicating overall compliance, or dict with details if return_details=True

        Raises:
            TypeError: If df is not a pandas DataFrame
            RuntimeError: If a rule raises an exception
        """
        if not isinstance(df, pd.DataFrame):
            raise TypeError(f"Expected pandas DataFrame, got {type(df).__name__}")

        if not self.rules:
            # No rules means automatically compliant
            return True if not return_details else {'compliant': True, 'rules_checked': 0}

        results = []
        failed_rules = []

        try:
            for idx, rule in enumerate(self.rules):
                try:
                    result = rule(df)
                    results.append(result)
                    if not result:
                        rule_name = getattr(self, '_rule_names', {}).get(idx, f"Rule {idx}")
                        failed_rules.append(rule_name)
                except Exception as e:
                    rule_name = getattr(self, '_rule_names', {}).get(idx, f"Rule {idx}")
                    raise RuntimeError(f"Rule '{rule_name}' failed with error: {e}") from e

            all_passed = all(results)

            self.last_check_results = {
                'compliant': all_passed,
                'rules_checked': len(results),
                'rules_passed': sum(results),
                'rules_failed': len(results) - sum(results),
                'failed_rules': failed_rules
            }

            if return_details:
                return self.last_check_results

            return all_passed

        except Exception as e:
            raise RuntimeError(f"Error during compliance check: {e}") from e

    def get_last_results(self) -> Dict[str, Any]:
        """
        Get the results from the last compliance check.

        Returns:
            Dictionary containing the last check results
        """
        return self.last_check_results.copy()

    def clear_rules(self) -> None:
        """Clear all compliance rules."""
        self.rules.clear()
        if hasattr(self, '_rule_names'):
            self._rule_names.clear()

    def __len__(self) -> int:
        """Return the number of rules."""
        return len(self.rules)

