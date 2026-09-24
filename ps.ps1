Get-CimInstance Win32_Process -Filter "name='java.exe'" | Where-Object { $_.CommandLine -match "myapp|fashionstore|spring|maven|java\.exe" } | Select-Object ProcessId, CommandLine | Format-List
