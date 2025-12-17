# Скрипт для загрузки проекта в GitHub
# Запустите этот скрипт в PowerShell: .\push-to-github.ps1

Write-Host "=== Загрузка проекта в GitHub ===" -ForegroundColor Green

# Проверка наличия Git
try {
    $gitVersion = git --version
    Write-Host "Git найден: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ОШИБКА: Git не установлен!" -ForegroundColor Red
    Write-Host "Установите Git с https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Инициализация репозитория (если еще не инициализирован)
if (-not (Test-Path .git)) {
    Write-Host "Инициализация Git репозитория..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "Git репозиторий уже инициализирован" -ForegroundColor Green
}

# Добавление всех файлов
Write-Host "Добавление файлов..." -ForegroundColor Yellow
git add .

# Проверка статуса
Write-Host "`nСтатус репозитория:" -ForegroundColor Cyan
git status

# Создание коммита
Write-Host "`nСоздание коммита..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Volunteer Hub platform"
git commit -m $commitMessage

# Добавление remote (если еще не добавлен)
$remoteUrl = "https://github.com/MakeByShake/Volonteer-Hub.git"
$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "Remote уже настроен: $existingRemote" -ForegroundColor Green
    if ($existingRemote -ne $remoteUrl) {
        Write-Host "Обновление remote URL..." -ForegroundColor Yellow
        git remote set-url origin $remoteUrl
    }
} else {
    Write-Host "Добавление remote репозитория..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
}

# Переименование ветки в main (если нужно)
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Переименование ветки в main..." -ForegroundColor Yellow
    git branch -M main
}

# Push в GitHub
Write-Host "`nЗагрузка в GitHub..." -ForegroundColor Yellow
Write-Host "ВНИМАНИЕ: Вам потребуется авторизация!" -ForegroundColor Red
Write-Host "Используйте Personal Access Token вместо пароля" -ForegroundColor Yellow
Write-Host "Создайте токен здесь: https://github.com/settings/tokens" -ForegroundColor Cyan

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Проект успешно загружен в GitHub!" -ForegroundColor Green
    Write-Host "Репозиторий: https://github.com/MakeByShake/Volonteer-Hub" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Ошибка при загрузке. Проверьте авторизацию." -ForegroundColor Red
    Write-Host "Создайте Personal Access Token: https://github.com/settings/tokens" -ForegroundColor Yellow
}

