# zipminator/compliance_check.py

class ComplianceCheck:
    def init(self, rules=None):
        self.rules = [] if rules is None else rules

    def add_rule(self, rule):
        self.rules.append(rule)

    def check(self, df):
        for rule in self.rules:
            if not rule(df):
        return False

