import os
import logging
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai

# Configure API Key
genai.configure(api_key=settings.CHATBOT_API_KEY)

class ChatbotViewSet(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # 1. Get the query from the frontend
        user_query = request.data.get('query', '')
        if not user_query:
            return Response({'error': 'No query provided'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Load Knowledge Base
        knowledge_base_path = os.path.join(settings.BASE_DIR, 'knowledge_base.txt')
        try:
            with open(knowledge_base_path, 'r') as file:
                knowledge_base = file.read()
        except FileNotFoundError:
            knowledge_base = "No specific knowledge base provided."

        # 3. Construct Prompt
        prompt = f"""
        You are a helpful AI assistant.
        Use the following knowledge base to answer the user's question.
        
        Knowledge Base:
        {knowledge_base}

        User Question: {user_query}
        """

        # 4. Call Google Gemini API with a VALID model from your list
        try:
            # ✅ CHANGED: Using 'gemini-2.0-flash' which is in your list
            model = genai.GenerativeModel('gemini-2.0-flash') 
            response = model.generate_content(prompt)
            
            answer = response.text
            
        except Exception as e:
            logging.error(f"AI generation failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 5. Return simple response
        return Response({'response': answer}, status=status.HTTP_200_OK)