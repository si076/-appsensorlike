set file=%1
set filesize=%~z1

if exist %file% (
    if %filesize% GTR 0 (
        exit /b 1
    ) else (
        exit /b 0
    )
) else (
    exit /b 0
)
