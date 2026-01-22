# AI-Powered Learning Management System (LMS)

![React](https://img.shields.io/badge/Frontend-React.js-blue)
![Django](https://img.shields.io/badge/Backend-Django-green)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)
![Tailwind CSS](https://img.shields.io/badge/Style-Tailwind_CSS-38B2AC)
![ML](https://img.shields.io/badge/AI-Scikit_Learn-orange)

A comprehensive Learning Management System designed to automate and enhance the educational assessment process. This platform integrates **Machine Learning** to provide automated essay grading and robust plagiarism detection (both internal and web-based).

## 🚀 Key Features

### 🤖 AI & Automated Assessment
* **Automated Essay Grading:** Utilizes **TF-IDF Vectorization** and **Cosine Similarity** to compare student answers against model answers.
* **Keyword Analysis:** Incorporates keyword matching logic (weighted at 40%) alongside similarity scoring (60%) to ensure technical accuracy in grading.
* **Web Plagiarism Detection:** Integrates with the **Google Custom Search API** to scan the web for copied content.
* **Internal Plagiarism Check:** Compares new submissions against a repository of previous student texts to detect internal copying.

### 📂 File Handling & System
* **Multi-Format Support:** Automatically extracts and processes text from uploaded **PDF**, **DOCX**, and **TXT** files.
* **Course Management:** Instructors can manage courses, lessons, and assignments.
* **Student Dashboard:** Students can upload assignments and view AI-generated grades.

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Backend:** Python Django, Django REST Framework
* **Database:** PostgreSQL
* **Machine Learning:** Scikit-learn, NumPy
* **Utilities:** PyPDF2, python-docx, Google API Client

## ⚙️ Installation & Setup

### Prerequisites
* Node.js & npm
* Python 3.8+
* PostgreSQL

### 1. Backend Setup (Django)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Geenukabineth/LMS.git](https://github.com/Geenukabineth/LMS.git)
    cd LMS/backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Ensure `scikit-learn`, `numpy`, `PyPDF2`, `python-docx`, and `google-api-python-client` are in your requirements.*

4.  **Configure Environment Variables:**
    Create a `.env` file in the backend root directory. You **must** include the Google API keys found in `utils.py` for plagiarism detection to work:

    ```env
    DEBUG=True
    SECRET_KEY=your_secret_key
    DATABASE_URL=postgres://user:password@localhost:5432/lms_db
    
    # Required for Web Plagiarism Check
    GOOGLE_API_KEY=your_google_api_key
    GOOGLE_CSE_ID=your_google_custom_search_engine_id
    ```

5.  **Run Migrations:**
    ```bash
    python manage.py migrate
    ```

6.  **Start the Server:**
    ```bash
    python manage.py runserver
    ```

### 2. Frontend Setup (React)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm start
    ```

## 🧠 How the AI Logic Works

The core logic resides in `utils.py`:

* **Grading Logic (`grade_essay_ml`):**
    The system cleans the text and calculates a similarity score between the student's answer and the model answer. If specific keywords are provided, the final score is a weighted average: **60% Similarity Score + 40% Keyword Match Score**.

* **Plagiarism Logic (`check_web_plagiarism`):**
    The system takes a 200-character chunk of the student's text and queries the Google Custom Search API. It then calculates the Cosine Similarity between the student's text and the search snippets. If similarity exceeds **15%**, it flags the source.

## 🤝 Contributing

Contributions are welcome!
1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add some NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
