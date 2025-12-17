# Скрипт для загрузки проекта в GitHub
# Выполните после установки Git

Write-Host "=== Загрузка Volunteer Hub в GitHub ===" -ForegroundColor Green
Write-Host ""

# Проверка Git
try {
    $gitVersion = git --version 2>&1
    Write-Host "✓ Git найден: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ОШИБКА: Git не установлен!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Установите Git:" -ForegroundColor Yellow
    Write-Host "1. Скачайте: https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host "2. Установите с настройками по умолчанию" -ForegroundColor Cyan
    Write-Host "3. Перезапустите PowerShell" -ForegroundColor Cyan
    Write-Host "4. Запустите этот скрипт снова" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Инициализация репозитория
if (-not (Test-Path .git)) {
    Write-Host "Инициализация Git репозитория..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "✓ Git репозиторий уже инициализирован" -ForegroundColor Green
}

Write-Host ""

# Добавление всех файлов
Write-Host "Добавление файлов в индекс..." -ForegroundColor Yellow
git add .

Write-Host ""

# Проверка статуса
Write-Host "Статус репозитория:" -ForegroundColor Cyan
git status --short

Write-Host ""

# Создание коммита
Write-Host "Создание коммита..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Volunteer Hub platform with all features"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Предупреждение: Возможно, нет изменений для коммита" -ForegroundColor Yellow
}

Write-Host ""

# Переименование ветки
Write-Host "Настройка ветки main..." -ForegroundColor Yellow
git branch -M main

Write-Host ""

# Добавление remote
$remoteUrl = "https://github.com/MakeByShake/Volonteer-Hub.git"
$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "✓ Remote уже настроен: $existingRemote" -ForegroundColor Green
    if ($existingRemote -ne $remoteUrl) {
        Write-Host "Обновление remote URL..." -ForegroundColor Yellow
        git remote set-url origin $remoteUrl
    }
} else {
    Write-Host "Добавление remote репозитория..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
}

Write-Host ""

# Push в GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Загрузка в GitHub..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠ ВАЖНО: Вам потребуется авторизация!" -ForegroundColor Red
Write-Host ""
Write-Host "GitHub больше не принимает пароли." -ForegroundColor Yellow
Write-Host "Используйте Personal Access Token:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Создайте токен: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host "2. Нажмите 'Generate new token (classic)'" -ForegroundColor Cyan
Write-Host "3. Выберите права: repo (полный доступ)" -ForegroundColor Cyan
Write-Host "4. Скопируйте токен" -ForegroundColor Cyan
Write-Host "5. При запросе пароля вставьте токен" -ForegroundColor Cyan
Write-Host ""
Write-Host "Нажмите Enter для продолжения..." -ForegroundColor Green
Read-Host

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ ПРОЕКТ УСПЕШНО ЗАГРУЖЕН В GITHUB!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Репозиторий: https://github.com/MakeByShake/Volonteer-Hub" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Следующий шаг: Подключите к Vercel для деплоя" -ForegroundColor Yellow
    Write-Host "https://vercel.com/new" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Ошибка при загрузке" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Возможные причины:" -ForegroundColor Yellow
    Write-Host "1. Неправильная авторизация (используйте токен)" -ForegroundColor Yellow
    Write-Host "2. Репозиторий уже существует и не пустой" -ForegroundColor Yellow
    Write-Host "3. Проблемы с сетью" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Попробуйте:" -ForegroundColor Cyan
    Write-Host "git push -u origin main --force" -ForegroundColor Cyan
    Write-Host "(только если репозиторий пустой или вы хотите перезаписать)" -ForegroundColor Yellow
}

