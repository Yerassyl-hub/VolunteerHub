# Инструкция по загрузке проекта в GitHub

## Шаг 1: Установите Git (если еще не установлен)
Скачайте Git с официального сайта: https://git-scm.com/download/win

## Шаг 2: Откройте терминал в папке проекта
Откройте PowerShell или Command Prompt в папке `C:\Users\User\Desktop\Volonter-Hub-main`

## Шаг 3: Инициализируйте Git репозиторий
```bash
git init
```

## Шаг 4: Добавьте все файлы (кроме тех, что в .gitignore)
```bash
git add .
```

## Шаг 5: Создайте первый коммит
```bash
git commit -m "Initial commit: Volunteer Hub platform"
```

## Шаг 6: Добавьте remote репозиторий
```bash
git remote add origin https://github.com/MakeByShake/Volonteer-Hub.git
```

## Шаг 7: Переименуйте ветку в main (если нужно)
```bash
git branch -M main
```

## Шаг 8: Загрузите код в GitHub
```bash
git push -u origin main
```

## Если возникнут проблемы с авторизацией:
GitHub больше не поддерживает пароли для HTTPS. Используйте один из вариантов:

### Вариант 1: Personal Access Token
1. Зайдите в GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Создайте новый token с правами `repo`
3. Используйте токен вместо пароля при push

### Вариант 2: SSH ключ
1. Сгенерируйте SSH ключ: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Добавьте ключ в GitHub → Settings → SSH and GPG keys
3. Измените remote URL: `git remote set-url origin git@github.com:MakeByShake/Volonteer-Hub.git`

## Проверка
После успешной загрузки проверьте репозиторий:
https://github.com/MakeByShake/Volonteer-Hub
