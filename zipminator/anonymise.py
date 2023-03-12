class Anonymize:
    @staticmethod
    def anonymize_columns(df, columns):

        df = df.copy()
        for col in columns:
            df[col] = df[col].apply(lambda x: ''.join(
                random.choices(string.ascii_uppercase + string.digits, k=10)))
        return df
