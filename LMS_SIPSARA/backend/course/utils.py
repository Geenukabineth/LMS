import os
import PyPDF2
import docx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from googleapiclient.discovery import build

# GOOGLE_API_KEY = "AIzaSyBLWHbJ5FL2Tfgs6DWctGoSS5ZHMTxtae4"
# GOOGLE_CSE_ID = "218ba21256a7f404e"
GOOGLE_API_KEY=os.environ.get('GOOGLE_API_KEY')
GOOGLE_CSE_ID=os.environ.get('GOOGLE_CSE_ID')

def check_web_plagiarism(student_text):
    """
    Searches Google for the student's text and compares similarity.
    Returns a list of external sources formatted for the frontend.
    """
    if not student_text or len(student_text) < 50:
        return []

    sources = []
    
    try:
        service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
        
        # Google limits queries to ~32 words. We take a distinct sample chunk.
        # In a production app, you might loop through several chunks.
        query_chunk = student_text[:200] 
        
        # Perform Search
        res = service.cse().list(q=query_chunk, cx=GOOGLE_CSE_ID, num=3).execute()
        items = res.get('items', [])

        for item in items:
            title = item.get('title')
            link = item.get('link')
            snippet = item.get('snippet', '')
            display_link = item.get('displayLink', 'external')

            # Compare Student Text vs Google Snippet using Cosine Similarity
            similarity = calculate_similarity(student_text, snippet)
            
            # Only report if similarity is relevant (e.g., > 15%)
            if similarity > 15:
                sources.append({
                    "domain": display_link,
                    "url": link,
                    "similarityPercent": round(similarity, 0),
                    "excerpts": [snippet] # Frontend expects an array of strings
                })

    except Exception as e:
        print(f"Web Search Error: {e}")
        return []

    return sources

def calculate_similarity(text1, text2):
    """Helper to calculate cosine similarity between two texts."""
    if not text1 or not text2: return 0.0
    try:
        documents = [text1, text2]
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return float(sim[0][0]) * 100
    except:
        return 0.0

def extract_text_from_file(uploaded_file):
    text = ""
    try:
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        if ext == '.pdf':
            reader = PyPDF2.PdfReader(uploaded_file)
            for page in reader.pages:
                text += page.extract_text() + " "
        elif ext == '.docx':
            doc = docx.Document(uploaded_file)
            for para in doc.paragraphs:
                text += para.text + " "
        elif ext == '.txt':
            text = uploaded_file.read().decode('utf-8')
        uploaded_file.seek(0)
    except Exception as e:
        print(f"Error reading file: {e}")
    return text.strip()

def check_plagiarism(new_text, previous_texts):
  
    if not previous_texts or not new_text:
        return {"score": 0.0, "matched_text": ""}

    try:
        documents = [new_text] + previous_texts
    
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)

        similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])

        if similarity_scores.size > 0:
            best_match_idx = np.argmax(similarity_scores)
            max_score = similarity_scores[0][best_match_idx] * 100
            
            matched_text_content = previous_texts[best_match_idx]

            return {
                "score": round(max_score, 2),
                "matched_text": matched_text_content
            }

    except Exception as e:
        print(f"Internal Check Error: {e}")

    return {"score": 0.0, "matched_text": ""}