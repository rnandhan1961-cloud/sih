# Shiksha Leap - Offline-First Gamified PWA for Rural Indian Schools

A lightweight, offline-first Progressive Web App designed specifically for students in grades 6-12 across rural India. Built to work seamlessly on low-end smartphones with limited connectivity.

## 🌟 Key Features

### 📱 Offline-First Design
- **Service Worker Caching**: All core assets and learning content cached for offline use
- **IndexedDB Storage**: Student progress and game logs stored locally
- **Background Sync**: Automatic data synchronization when connection is restored
- **PWA Capabilities**: Install as native app on any device

### 🎮 Gamified Learning
- **Interactive Games**: Subject-specific educational games for each grade
- **Quiz System**: Comprehensive quizzes with instant feedback
- **Achievement System**: Badges and rewards for learning milestones
- **Progress Tracking**: Visual progress indicators and performance analytics

### 🌍 Multi-Language Support
- **4 Languages**: English, Hindi, Tamil, and Odia
- **Dynamic Translation**: Real-time language switching without page reload
- **Localized Content**: All UI elements and educational content translated
- **Cultural Adaptation**: Content adapted for Indian rural context

### 🤖 AI-Powered Personalization
- **Knowledge Tracing**: TensorFlow.js models for mastery estimation
- **Contextual Bandits**: Personalized activity recommendations
- **On-Device AI**: All AI processing happens locally for privacy and offline use
- **Adaptive Learning**: Content difficulty adjusts based on student performance

### 🏫 UDISE Integration
- **School Database**: Complete UDISE school data integration
- **Auto-fill Registration**: Automatic school and district population
- **Teacher-Student Mapping**: Teachers assigned to schools via UDISE codes
- **District-wise Analytics**: Performance tracking by geographic regions

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- SQLite (included with Python)
- Modern web browser with PWA support

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd shiksha-leap
   pip install -r requirements.txt
   ```

2. **Initialize Database**
   ```bash
   python database.py
   ```

3. **Run Application**
   ```bash
   python app.py
   ```

4. **Access Application**
   Open `http://localhost:5000` in your browser

### Docker Deployment

```bash
# Build and run with Docker
docker-compose up --build

# Or build manually
docker build -t shiksha-leap .
docker run -p 5000:5000 shiksha-leap
```

## 📊 Architecture

### Backend (Flask)
- **Lightweight API**: Minimal Flask app focused on data sync and authentication
- **SQLite Database**: Single-file database for easy deployment and backup
- **OTP Authentication**: Secure login without passwords using mobile/email OTP
- **CORS Enabled**: Cross-origin support for flexible deployment

### Frontend (Vanilla JS)
- **No Framework Dependencies**: Pure HTML5, CSS3, and JavaScript for maximum performance
- **Mobile-First CSS**: Custom utility framework optimized for touch interfaces
- **Progressive Enhancement**: Works on any device, enhanced on modern browsers
- **Accessibility**: WCAG 2.1 compliant with screen reader support

### PWA Features
- **App Manifest**: Installable as native app on mobile devices
- **Service Worker**: Comprehensive offline caching and background sync
- **Responsive Design**: Optimized for screens from 320px to 1920px
- **Touch Gestures**: Swipe navigation and touch-friendly interactions

## 🎯 User Flows

### Student Journey
1. **Authentication**: Login with mobile/email + OTP verification
2. **Registration**: Complete profile with UDISE code auto-fill
3. **Grade Selection**: Choose current grade (6-12) for personalized content
4. **Subject Learning**: Access games and quizzes by subject
5. **Progress Tracking**: View achievements, scores, and learning analytics

### Teacher Journey
1. **Authentication**: Login with credentials + OTP verification
2. **Registration**: Complete teacher profile with qualifications
3. **Dashboard Access**: View assigned students and class performance
4. **Analytics**: Monitor student progress with detailed charts and reports
5. **Student Management**: Filter and search students by various criteria

## 📚 Database Schema

### Core Tables
- **users**: Authentication and role management
- **students**: Student profile information
- **teachers**: Teacher profile and qualifications
- **udise_schools**: Complete UDISE school database
- **game_logs**: Student performance tracking
- **achievements**: Badge and achievement system
- **student_progress**: Learning progress and mastery levels

### Key Relationships
- Students linked to schools via UDISE codes
- Teachers assigned to schools and grades
- Game logs track individual student performance
- Achievements awarded based on performance milestones

## 🔧 API Endpoints

### Authentication
- `POST /api/send-otp` - Request OTP for login
- `POST /api/verify-otp` - Verify OTP and authenticate user

### Registration
- `POST /api/register-student` - Complete student registration
- `POST /api/register-teacher` - Complete teacher registration
- `GET /api/school-info/<udise_code>` - Get school details by UDISE code
- `GET /api/school-search?q=<query>` - Search schools by name/code

### Learning & Analytics
- `POST /api/game-log` - Log student game/quiz performance
- `POST /api/sync-offline-data` - Sync offline data when back online
- `GET /api/teacher/dashboard-data` - Get teacher dashboard analytics

## 🎨 Design Philosophy

### Mobile-First Approach
- **Touch-Friendly**: Minimum 48px touch targets
- **High Contrast**: Readable on low-quality screens
- **Large Typography**: Optimized for various screen sizes and viewing conditions
- **Simple Navigation**: Intuitive flow with consistent back button placement

### Performance Optimization
- **Lightweight**: Total app size under 2MB for initial load
- **Lazy Loading**: Content loaded on-demand to reduce initial bundle
- **Image Optimization**: WebP format with fallbacks for older devices
- **Minimal Dependencies**: No heavy frameworks or libraries

### Cultural Sensitivity
- **Local Languages**: Native script support for Hindi, Tamil, and Odia
- **Regional Content**: Educational content adapted for Indian curriculum
- **Rural Context**: Designed for intermittent connectivity and shared devices
- **Inclusive Design**: Accessible to students with varying technical literacy

## 🔮 Future Enhancements

### Scalability Features
- **Multi-Board Support**: Extend to different state education boards (SCERT, CBSE, ICSE)
- **Content Management**: Admin panel for teachers to upload custom content
- **Parent Portal**: Parent access to student progress and achievements
- **Peer Learning**: Student collaboration and peer tutoring features

### Advanced AI Features
- **Emotion Recognition**: Detect student engagement through device sensors
- **Voice Interaction**: Voice-based quizzes and pronunciation practice
- **Adaptive Difficulty**: Real-time difficulty adjustment based on performance
- **Learning Path Optimization**: AI-generated personalized learning sequences

### Technical Improvements
- **PostgreSQL Migration**: Database upgrade for larger deployments
- **Real-time Sync**: WebSocket-based real-time data synchronization
- **Advanced Analytics**: Machine learning insights for teachers and administrators
- **Content Delivery Network**: Global content distribution for faster loading

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a Pull Request

### Code Standards
- **Python**: Follow PEP 8 style guidelines
- **JavaScript**: Use ES6+ features with proper error handling
- **CSS**: Mobile-first responsive design principles
- **Documentation**: Comment complex logic and API endpoints

### Testing
- Test on multiple devices and screen sizes
- Verify offline functionality works correctly
- Check all language translations are accurate
- Ensure accessibility standards are met

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **UDISE Database**: Ministry of Education, Government of India
- **Rural Education Initiatives**: Various NGOs and government programs
- **Open Source Community**: TensorFlow.js, Chart.js, and other libraries
- **Rural Students and Teachers**: For feedback and testing

## 📞 Support

For technical support or questions:
- **GitHub Issues**: Create an issue for bugs or feature requests
- **Email**: support@shikshaleap.org
- **Documentation**: Visit our [Wiki](wiki-url) for detailed guides

---

**Shiksha Leap** - Empowering rural education through technology 🚀📚