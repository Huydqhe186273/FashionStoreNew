@echo off
if not defined JAVA_HOME (
  if exist "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.4.101-hotspot"
  ) else if exist "C:\Program Files\Java\jdk-17" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
  )
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
set "MAVEN_OPTS=-Xmx512m"
call .\mvnw.cmd spring-boot:run "-Dspring-boot.run.jvmArguments=-Xmx512m -Xms128m"

