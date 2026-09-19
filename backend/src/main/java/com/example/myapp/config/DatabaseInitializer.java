package com.example.myapp.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class DatabaseInitializer {
    public static void initialize(String DatasourceUrl, String Username, String Password) throws Exception {
        String DatabaseName = extractDatabaseName(DatasourceUrl);
        String MasterUrl = DatasourceUrl.replaceFirst("(?i)databaseName=[^;]+", "databaseName=master");

        try (Connection Connection = DriverManager.getConnection(MasterUrl, Username, Password);
             PreparedStatement CheckDatabase = Connection.prepareStatement("SELECT DB_ID(?)")) {
            CheckDatabase.setString(1, DatabaseName);

            try (ResultSet Result = CheckDatabase.executeQuery()) {
                if (!Result.next() || Result.getObject(1) == null) {
                    String SafeDatabaseName = DatabaseName.replace("]", "]]" );
                    try (Statement CreateDatabase = Connection.createStatement()) {
                        CreateDatabase.executeUpdate("CREATE DATABASE [" + SafeDatabaseName + "]");
                    }
                }
            }
        }
    }

    private static String extractDatabaseName(String Url) {
        String Prefix = "databaseName=";
        int Start = Url.indexOf(Prefix);
        if (Start < 0) {
            throw new IllegalStateException("spring.datasource.url must contain databaseName");
        }

        int ValueStart = Start + Prefix.length();
        int End = Url.indexOf(';', ValueStart);
        String Name = End < 0 ? Url.substring(ValueStart) : Url.substring(ValueStart, End);
        if (!Name.matches("[A-Za-z0-9_]+")) {
            throw new IllegalStateException("Unsupported database name: " + Name);
        }
        return Name;
    }
}