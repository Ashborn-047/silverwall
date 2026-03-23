@echo off
cd /d "%~dp0"
echo Publishing SpacetimeDB schema...
spacetime publish -y spacetimedb-uorks
