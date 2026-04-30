import pandas as pd
import sys

try:
    df = pd.read_excel('amena.xlsx')
    print("Columns:", list(df.columns))
    print("First 3 rows:")
    print(df.head(3).to_dict(orient='records'))
except Exception as e:
    print("Error:", e)
