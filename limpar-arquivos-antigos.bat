@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Isto move os arquivos antigos (que o site novo nao usa mais) para a pasta _antigos.
echo Nada e apagado. Depois de conferir que o site funciona, voce pode apagar a _antigos.
pause
mkdir _antigos 2>nul
for %%f in (styles.css animations.css efeitos.js members.js snow.js bug.html desktop.png preview-check.png) do if exist "%%f" move "%%f" _antigos\ >nul
for %%d in (public grounds) do if exist "%%d" move "%%d" _antigos\ >nul
for %%m in (noir emmanuel baresi caion) do (
  mkdir "_antigos\%%m" 2>nul
  for %%f in ("%%m\*.js" "%%m\backup.html") do if exist "%%~f" move "%%~f" "_antigos\%%m\" >nul
  for %%d in (public r2.wya.lol index_files) do if exist "%%m\%%d" move "%%m\%%d" "_antigos\%%m\" >nul
)
echo.
echo Pronto! Arquivos antigos movidos para _antigos
pause
