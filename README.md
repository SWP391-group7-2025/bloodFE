# 🩸 Blood Donation Management System

Hệ thống quản lý hiến máu hiện đại với React Frontend và Express.js Backend.

## 📋 Mục lục
- [Giới thiệu](#giới-thiệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Cách push code lên Git](#cách-push-code-lên-git)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Tính năng chính](#tính-năng-chính)

## 🚀 Giới thiệu

Hệ thống quản lý hiến máu toàn diện bao gồm:
- **Frontend**: React.js với Vite
- **Backend**: Express.js API
- **Database**: MySQL/PostgreSQL
- **Authentication**: JWT
- **UI/UX**: Modern design với CSS Modules

## 🛠 Công nghệ sử dụng

### Frontend
- **React 18+** - UI Library
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP Client
- **React Toastify** - Notifications
- **CSS Modules** - Styling

### Backend
- **Express.js** - Web Framework
- **Node.js** - Runtime
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin requests

## 📦 Cài đặt và chạy dự án

### 1. Clone repository
```bash
git clone <your-repository-url>
cd blood-donation-system
```

### 2. Cài đặt Frontend
```bash
cd my-react-app
npm install
npm run dev
```

### 3. Cài đặt Backend
```bash
cd ExpressJS
npm install
npm start
```

## 🌟 Cách push code lên Git

### 📝 Bước 1: Kiểm tra trạng thái Git
```bash
# Kiểm tra các file đã thay đổi
git status

# Xem chi tiết thay đổi
git diff
```

### 📝 Bước 2: Thêm files vào staging area
```bash
# Thêm tất cả files
git add .

# Hoặc thêm từng file cụ thể
git add src/components/Register/Register.jsx
git add src/components/Register/Register.module.css

# Hoặc thêm theo thư mục
git add src/components/
```

### 📝 Bước 3: Commit changes
```bash
# Commit với message mô tả
git commit -m "✨ feat: Update Register component styling to match Login design"

# Hoặc commit với message chi tiết hơn
git commit -m "🎨 style: Redesign Register form
- Update CSS to match Login component style
- Improve responsive design
- Add consistent color scheme
- Enhance user experience"
```

### 📝 Bước 4: Push lên remote repository
```bash
# Push lên branch hiện tại (thường là main hoặc master)
git push origin main

# Hoặc nếu đang ở branch khác
git push origin <branch-name>

# Push lần đầu tiên (set upstream)
git push -u origin main
```

### 🔄 Workflow Git thông dụng

#### Tạo branch mới cho feature
```bash
# Tạo và chuyển sang branch mới
git checkout -b feature/register-styling

# Hoặc
git switch -c feature/register-styling
```

#### Làm việc và commit
```bash
# Sau khi code xong
git add .
git commit -m "🎨 style: Update Register component styling"
```

#### Merge về main
```bash
# Chuyển về main
git checkout main

# Pull code mới nhất
git pull origin main

# Merge branch feature
git merge feature/register-styling

# Push lên remote
git push origin main

# Xóa branch đã merge (optional)
git branch -d feature/register-styling
```

### 🏷️ Quy ước đặt tên commit

#### Prefix thông dụng:
- `✨ feat:` - Thêm tính năng mới
- `🐛 fix:` - Sửa bug
- `🎨 style:` - Thay đổi giao diện, CSS
- `♻️ refactor:` - Refactor code
- `📝 docs:` - Cập nhật documentation
- `🧪 test:` - Thêm hoặc sửa tests
- `🔧 config:` - Thay đổi config
- `🚀 deploy:` - Deploy related
- `⬆️ upgrade:` - Upgrade dependencies

#### Ví dụ commit messages:
```bash
git commit -m "✨ feat: Add user authentication system"
git commit -m "🐛 fix: Resolve login form validation issue"
git commit -m "🎨 style: Update Register component to match Login design"
git commit -m "♻️ refactor: Optimize API call functions"
git commit -m "📝 docs: Add Git workflow guide to README"
```

### 🚨 Các lệnh Git hữu ích khác

#### Kiểm tra lịch sử
```bash
# Xem log commit
git log --oneline

# Xem chi tiết commits
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset'
```

#### Hoàn tác thay đổi
```bash
# Hoàn tác file chưa add
git checkout -- <filename>

# Hoàn tác file đã add
git reset HEAD <filename>

# Hoàn tác commit cuối
git reset --soft HEAD~1
```

#### Làm việc với remote
```bash
# Thêm remote repository
git remote add origin <repository-url>

# Xem remote repositories
git remote -v

# Pull code mới nhất
git pull origin main

# Fetch thông tin mới
git fetch origin
```

## 📁 Cấu trúc thư mục

```
blood-donation-system/
├── my-react-app/              # Frontend React
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── assets/           # Images, icons
│   │   └── locales/          # Internationalization
│   ├── public/
│   └── package.json
├── ExpressJS/                # Backend API
│   ├── controllers/          # API controllers
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   └── config/              # Configuration files
└── README.md
```

## 🎯 Tính năng chính

### 👥 Quản lý người dùng
- Đăng ký/Đăng nhập
- Phân quyền (Admin, Staff, Member)
- Profile management

### 🩸 Quản lý hiến máu
- Đăng ký lịch hiến máu
- Quản lý thông tin donor
- Tracking donation history

### 🏥 Quản lý nhận máu
- Yêu cầu nhận máu
- Quản lý recipient
- Blood matching system

### 📊 Báo cáo và thống kê
- Dashboard analytics
- Donation statistics
- Blood inventory reports

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m '✨ feat: Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Email**: your-email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)
- **Project Link**: [https://github.com/your-username/blood-donation-system](https://github.com/your-username/blood-donation-system)

---

*Được phát triển với ❤️ cho cộng đồng hiến máu*