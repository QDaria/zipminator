# zipminator/audit_trail.py
class AuditTrail:
    def init(self):
        self.audit_trail = []

    def add_log(self, log):
        self.audit_trail.append(log)

    def save_logs(self, file_name):
        with open(file_name, 'w') as f:
            for log in self.audit_trail:
                f.write(log + '\n')
