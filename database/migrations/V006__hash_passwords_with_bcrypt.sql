/* Migration V006: Ma hoa mat khau nguoi dung hien co bang BCrypt */
UPDATE Users
SET PasswordHash = '$2a$10$NeNZaHk4pyzYOgh8FzBceu3nxJPxeMDMs5RgxWYTDff2iUk1Qhtlu'
WHERE PasswordHash = 'admin123' OR PasswordHash = 'hashed_password';
GO

UPDATE Users
SET PasswordHash = '$2a$10$l6qg93VgbOTyXh/6Taa.OuCcvGX6aVqEmI4R1g2YzLP5wixav/GK6'
WHERE PasswordHash = '123456';
GO
