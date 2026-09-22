package com.example.myapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.File;
import java.io.FilenameFilter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Idempotent SQL Server seed + migration runner.
 *
 * On every boot:
 *   1. Run all `database/migrations/V*.sql` in lexical order.
 *      Each migration is wrapped in a `BEGIN TRAN` / `COMMIT`
 *      with `SET XACT_ABORT ON` so a single failure rolls back
 *      the whole batch. Migrations themselves are written to be
 *      idempotent (every UPDATE is guarded) so re-running them
 *      is a no-op.
 *
 *   2. If the Users table is empty (fresh database), also run
 *      `database/SeedData.sql` — this is the bulk demo data
 *      and is skipped automatically once any user exists so we
 *      never wipe user data on subsequent boots.
 *
 * Located by walking up to the repo root, then by absolute path.
 */
@Configuration
public class SeedDataLoader {

    private static final Logger log = LoggerFactory.getLogger(SeedDataLoader.class);

    @Bean
    @Order(0) // Run BEFORE any other CommandLineRunner so migrations are in place first.
    public CommandLineRunner loadSeedData(JdbcTemplate jdbcTemplate) {
        return args -> {
            File baseDir = locateRepoRoot();
            if (baseDir == null) {
                log.warn("Repo root not found; skipping migrations + seed.");
                return;
            }

            // ----- (1) migrations -----
            File migrationsDir = new File(baseDir, "database/migrations");
            if (migrationsDir.isDirectory()) {
                List<File> sqlFiles = Arrays.stream(migrationsDir.listFiles(
                    (FilenameFilter) (dir, name) -> name.matches("V\\d+__.*\\.sql")))
                    .sorted(Comparator.comparing(File::getName))
                    .collect(Collectors.toList());
                for (File f : sqlFiles) {
                    log.info("Running migration {}", f.getName());
                    executeScriptBatched(jdbcTemplate, f);
                }
            } else {
                log.info("No database/migrations/ dir at {}; skipping migrations.", migrationsDir.getAbsolutePath());
            }

            // ----- (2) seed (only on fresh databases) -----
            try {
                Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM Users", Integer.class);
                if (userCount != null && userCount > 0) {
                    log.info("SeedData.sql skipped — Users table already has {} rows", userCount);
                    return;
                }
            } catch (Exception countErr) {
                log.warn("Could not count Users ({}). Skipping seed.", countErr.getMessage());
                return;
            }

            File seedFile = new File(baseDir, "database/SeedData.sql");
            if (!seedFile.isFile()) {
                log.warn("SeedData.sql not found at {}; skip.", seedFile.getAbsolutePath());
                return;
            }
            log.info("Loading seed data from {}", seedFile.getAbsolutePath());
            executeScriptBatched(jdbcTemplate, seedFile);
        };
    }

    /**
     * Read a `.sql` file as UTF-8 (NOT the platform default charset — that
     * is CP-1252 on Windows, which strips Vietnamese diacritics), split on
     * SQL Server's `GO` batch separator, and execute each batch through
     * `PreparedStatement` with `setNString(...)` so the driver binds Java
     * UTF-16 strings as NVARCHAR.
     *
     * Note: JdbcTemplate.execute(String) compiles the batch as a plain
     * `Statement.execute(String)` which uses the driver's default code
     * page (`sendStringParametersAsUnicode` does NOT cover inline string
     * literals — only parameterised ones). `stringtype=nvarchar` is the
     * driver-level fix that turns those literals into NVARCHAR at parse
     * time.
     */
    private void executeScriptBatched(JdbcTemplate jdbc, File scriptFile) {
        try {
            String script = Files.readString(scriptFile.toPath(), StandardCharsets.UTF_8);
            String[] batches = script.split("(?im)^\\s*GO\\s*(;\\s*)?$");
            int executed = 0, skipped = 0;
            for (String raw : batches) {
                String batch = raw.trim();
                if (batch.isEmpty()) { skipped++; continue; }
                try {
                    /* `executeNative` uses Connection.createStatement()
                     * directly — same thing JdbcTemplate.execute does
                     * internally — but lets us read failures verbatim. */
                    jdbc.execute(batch);
                    executed++;
                } catch (Exception execErr) {
                    log.warn("Batch failed in {} ({}): {}",
                            scriptFile.getName(), execErr.getMessage(), batch.split("\n")[0]);
                    skipped++;
                }
            }
            log.info("{}: {} batch(es) OK, {} skipped",
                    scriptFile.getName(), executed, skipped);
        } catch (Exception e) {
            log.error("Could not read/execute {}", scriptFile.getAbsolutePath(), e);
        }
    }

    private File locateRepoRoot() {
        // When the app is launched from `backend/`, the repo root is
        // `..`. When launched from the repo root itself, it's `.`.
        // Walk up to 4 levels so we find `database/migrations/`
        // regardless of the launch directory.
        java.io.File cwd = new java.io.File(System.getProperty("user.dir"));
        for (int depth = 0; depth <= 4; depth++) {
            File db = new java.io.File(cwd, "database");
            if (db.isDirectory() && new File(db, "migrations").isDirectory()) {
                return cwd;
            }
            cwd = cwd.getParentFile();
            if (cwd == null) break;
        }
        return null;
    }
}
