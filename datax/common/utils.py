class Utils():
    @classmethod
    def getSystemInfo(cls, kind):
        rs = {}
        if kind == 'mysql':
            rs['has_derict_sql'] = False
            rs['database'] = "information_schema"
            rs['table'] = "SCHEMATA"
            rs['column'] = 'SCHEMA_NAME'
        if kind == 'pgsql':
            rs['has_derict_sql'] = False
            rs['database'] = "postgres"
            rs['table'] = "pg_database"
            rs['column'] = 'datname'
        if kind == 'mssql':
            rs['has_derict_sql'] = True
            rs['database'] = 'master'
            rs['column'] = 'name'
            rs['sql'] = 'select * from sys.databases'
        if kind == 'oracle':
            rs['has_derict_sql'] = False
            rs['database']="oracle"
            rs['table']="user_tab_columns"
            rs['column']="TABLE_NAME"

        return rs

    @classmethod
    def databaseColumn(cls, kind, table, database=''):
        rs = {}
        if kind == 'mysql':
            rs['sql'] = 'desc ' + table
            rs['column'] = 'Field'
            rs['columnDatabase'] = "select * from information_schema.COLUMNS where TABLE_SCHEMA = '" + database + "'"
            rs['columnTableField'] = 'TABLE_NAME'
            rs['columnField'] = 'COLUMN_NAME'
            rs['columnFieldType'] = 'DATA_TYPE'
            rs['name'] = 'COLUMN_COMMENT'
            # 用于查询所有表和根据特定表查询表内字段
            rs['getAllTableSql'] = "SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" + database + "'"
            rs['getTableColumnSql'] = rs['columnDatabase'] + ( ' and TABLE_NAME = \'' + table + '\'') if table else ''
        if kind == 'pgsql':
            rs['sql'] = """
            SELECT a.attnum,
           a.attname AS field,
           t.typname AS type,
           a.attlen AS length,
           a.atttypmod AS lengthvar,
           a.attnotnull AS notnull,
           b.description AS comment
        FROM pg_class c,
           pg_attribute a
           LEFT OUTER JOIN pg_description b ON a.attrelid=b.objoid AND a.attnum = b.objsubid,
           pg_type t
        WHERE c.relname = '""" + table + """'
           and a.attnum > 0
           and a.attrelid = c.oid
           and a.atttypid = t.oid
        ORDER BY a.attnum
           """
            rs['column'] = 'field'
            rs['columnDatabase'] = "select * from information_schema.columns where table_schema = 'public'"
            rs['columnTableField'] = 'table_name'
            rs['columnField'] = 'column_name'
            rs['columnFieldType'] = 'data_type'
            #用于查询所有表和根据特定表查询表内字段
            rs['getAllTableSql'] = "select relname as table_name, reltuples as rowCounts from pg_class where relkind = 'r' and relnamespace = (select oid from pg_namespace where nspname='public') order by rowCounts desc;"
            rs['getTableColumnSql'] = rs['columnDatabase'] + (' and relname = \'' + table + '\'') if table else ''
        if kind == 'mssql':
            rs['sql'] = """select syscolumns.name ,systypes.name as type, syscolumns.isnullable ,
                syscolumns.length, case when sys.extended_properties.VALUE is null then syscolumns.name else sys.extended_properties.VALUE end  as 'columnname'
                from syscolumns join systypes on syscolumns.xusertype = systypes.xusertype
                left join sys.extended_properties on syscolumns.id = sys.extended_properties.major_id
                and syscolumns.colid = sys.extended_properties.minor_id
                where syscolumns.id = object_id('""" + table + """')"""
            rs['column'] = 'name'
            rs['columnDatabase'] = """ SELECT
                                a.name AS dbcolumn,
                                b.name AS dbtable,
                                c.name AS data_type,
                                isnull(g.value , a.name)
                                AS columnname
                            FROM
                                sysColumns a
                            JOIN sysobjects b ON a.id = b.id
                            AND b.type = 'U'
                            LEFT JOIN sysTypes c ON a.xtype = c.xtype
                            AND c.name <> 'sysname'
                            LEFT JOIN sys.extended_properties g ON a.id = g.major_id
                            AND a.colid = g.minor_id """
            rs['columnTableField'] = 'dbtable'
            rs['columnField'] = 'dbcolumn'
            rs['columnFieldType'] = 'data_type'
            rs['name'] = 'columnname'
            # 用于查询所有表和根据特定表查询表内字段
            rs['getAllTableSql'] = "SELECT name as dbtable FROM sysobjects WHERE type = 'U' AND sysstat = '83'"
            rs['getTableColumnSql'] = rs['columnDatabase'] + (' where name = \'' + table + '\'') if table else ''
        if kind == 'oracle':
            rs['sql'] = """select COLUMN_NAME,DATA_TYPE,DATA_LENGTH from user_tab_columns  WHERE TABLE_NAME = upper('"""+table+"""') or TABLE_NAME = lower('"""+table+"""')"""
            rs['column'] = 'column_name'
            rs['columnDatabase'] = 'select * from user_tab_columns'
            rs['columnTableField'] = 'table_name'
            rs['columnField'] = 'column_name'
            rs['columnFieldType'] = 'data_type'
            rs['tablesql'] = "select TABLE_NAME from user_tab_columns  group by TABLE_NAME"
            # 用于查询所有表和根据特定表查询表内字段
            rs['getAllTableSql'] = rs['tablesql']
            rs['getTableColumnSql'] = rs['columnDatabase'] + (' where table_name = \'' + table + '\'') if table else ''
        return rs
    @classmethod
    def getColumnType(cls, type, alltype):
        if type in alltype['INT']:
            return 'num'
        elif type in alltype['BIGINT']:
            return 'num'
        elif type in alltype['FLOAT']:
            return 'num'
        elif type in alltype['VARCHAR']:
            return 'str'
        elif type in alltype['TEXT']:
            return 'str'
        elif type in alltype['DATE']:
            return 'date'
        elif type in alltype['DATETIME']:
            return 'date'
        else:
            return 'str'
