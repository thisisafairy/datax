
COLUMN_TYPE = {
    'mysql': {
        'INT': ['tinyint', 'smallint', 'mediumint', 'int', 'integer'],
        'BIGINT': ['bigint'],
        'FLOAT': ['real', 'double', 'float', 'decimal', 'numeric'],
        'VARCHAR': ['bit', 'char', 'varchar', 'set', 'time', 'enum'],
        'TEXT': ['text', 'tinytext', 'mediumtext', 'longtext'],
        'DATE': ['date'],
        'DATETIME': ['datetime'],
        'TIMESTAMP': ['timestamp'],
    },
    'mssql': {
        'INT': ['tinyint', 'smallint', 'int', 'integer'],
        'BIGINT': ['bigint'],
        'FLOAT': ['real', 'double', 'float', 'decimal', 'numeric', 'money', 'smallmoney'],
        'VARCHAR': ['bit', 'char', 'varchar', 'set', 'time', 'enum', 'nchar', 'nvarchar'],
        'TEXT': ['text', 'tinytext', 'mediumtext', 'longtext', 'ntext'],
        'DATE': ['date'],
        'DATETIME': ['datetime', 'datetimeoffset', 'smalldatetime','datetime2'],
        'TIMESTAMP': ['timestamp'],
    },
    'pgsql': {
        'INT': ['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigserial'],
        'BIGINT': ['bigint'],
        'FLOAT': ['real', 'double', 'float', 'decimal', 'numeric'],
        'VARCHAR': ['bit', 'char', 'varchar', 'set', 'time', 'enum', 'boolean', 'character', 'cidr', 'inet', 'macaddr'],
        'TEXT': ['text', 'tinytext', 'mediumtext', 'longtext'],
        'DATE': ['date'],
        'DATETIME': ['datetime'],
        'TIMESTAMP': ['timestamp','timestampz']
    },
    "oracle": {
        'INT': ['INT', 'INTEGER'],
        'BIGINT': ['BIGINIT'],
        'FLOAT': ['DOUBLE', 'FLOAT', 'DECIMAL', 'NUMBER'],
        'VARCHAR': ['BIT', 'CHAR',  'NVARCHAR2', 'VARCHAR2'],
        'TEXT': ['CLOB', 'NCLOB','BLOB'],
        'DATE': ['DATE'],
        'DATETIME': ['DATETIME'],
        'TIMESTAMP': ['TIMESTAMP']
    },
    "odbc": {#teradata data type
        'INT': ['BYTEINT', 'SMALLINT', 'INTEGER'],
        'BIGINT': ['BIGINIT'],
        'FLOAT': ['FLOAT', 'NUMERIC', 'DECIMAL'],
        'VARCHAR': ['CHAR', 'VARCHAR'],
        'TEXT': ['LONG VARCHAR'],
        'DATE': ['TIME'],
        'DATETIME': ['DATETIME'],
        'TIMESTAMP': ['TIMESTAMP']
    }
}
