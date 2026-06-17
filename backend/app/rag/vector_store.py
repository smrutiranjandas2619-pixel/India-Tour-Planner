import os
import json
import numpy as np
import warnings

# Suppress the deprecation warning from generativeai package
warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai

class SimpleVectorStore:
    def __init__(self, storage_path="vector_store.json"):
        self.storage_path = storage_path
        self.items = []  # List of dicts: {"id": str, "text": str, "metadata": dict, "vector": list}
        self.fallback_vocabulary = {} # Vocab for fallback TF-IDF if API key is not set
        
    def add_item(self, item_id, text, metadata=None, api_key=None):
        """Adds a text item to the vector store, generating its embedding."""
        vector = self._get_embedding(text, api_key)
        
        # Remove existing if exists
        self.items = [item for item in self.items if item["id"] != item_id]
        
        self.items.append({
            "id": item_id,
            "text": text,
            "metadata": metadata or {},
            "vector": vector
        })

    def _get_embedding(self, text, api_key=None):
        """Generates embedding using Gemini API, or falls back to a custom TF-IDF vector."""
        if api_key:
            try:
                genai.configure(api_key=api_key)
                response = genai.embed_content(
                    model="models/text-embedding-004",
                    contents=text,
                    task_type="retrieval_document"
                )
                return response["embedding"]
            except Exception as e:
                print(f"Embedding API failed: {e}. Falling back to TF-IDF vectorizer.")
        
        return self._generate_tfidf_vector(text)

    def _build_fallback_vocabulary(self):
        """Helper to build vocabulary for fallback TF-IDF from all current texts."""
        vocab = {}
        idx = 0
        for item in self.items:
            words = self._tokenize(item["text"])
            for word in words:
                if word not in vocab:
                    vocab[word] = idx
                    idx += 1
        self.fallback_vocabulary = vocab
        
        # Re-vectorize existing fallback vectors using new vocabulary
        for item in self.items:
            # Only update if the vector is a list of floats (not embeddings)
            if len(item["vector"]) != 768: # 768 is Gemini's standard embedding size
                item["vector"] = self._generate_tfidf_vector(item["text"])

    def _tokenize(self, text):
        """Simplistic tokenizer."""
        return [w.strip(".,!?\"'()[]{}*:;-").lower() for w in text.split() if len(w) > 2]

    def _generate_tfidf_vector(self, text):
        """Generates a simple normalized frequency vector based on global vocabulary."""
        words = self._tokenize(text)
        vector = [0.0] * max(len(self.fallback_vocabulary), 100)
        
        # If vocabulary is empty, populate it temporarily
        for word in words:
            if word in self.fallback_vocabulary:
                idx = self.fallback_vocabulary[word]
                if idx < len(vector):
                    vector[idx] += 1.0
            else:
                # Add to temporary indexing
                idx = hash(word) % len(vector)
                vector[idx] += 1.0
                
        # Normalize vector
        vec_np = np.array(vector)
        norm = np.linalg.norm(vec_np)
        if norm > 0:
            vec_np = vec_np / norm
        return vec_np.tolist()

    def query(self, query_text, top_k=5, api_key=None):
        """Queries the store and returns the top_k most similar items."""
        if not self.items:
            return []
            
        # Get query vector
        query_vec = self._get_embedding(query_text, api_key)
        
        # If query_vec and database vectors are mismatching in length, rebuild fallback vectors
        is_query_embedding = (len(query_vec) == 768)
        
        results = []
        for item in self.items:
            item_vec = item["vector"]
            
            # Align embedding vs keyword vector matching
            is_item_embedding = (len(item_vec) == 768)
            if is_query_embedding != is_item_embedding:
                # Need consistent types. If mismatch, force both to use temporary TF-IDF
                q_v = np.array(self._generate_tfidf_vector(query_text))
                i_v = np.array(self._generate_tfidf_vector(item["text"]))
            else:
                q_v = np.array(query_vec)
                i_v = np.array(item_vec)
                
            # Cosine similarity
            dot_product = np.dot(q_v, i_v)
            norm_q = np.linalg.norm(q_v)
            norm_i = np.linalg.norm(i_v)
            
            similarity = dot_product / (norm_q * norm_i) if (norm_q > 0 and norm_i > 0) else 0.0
            
            results.append({
                "id": item["id"],
                "text": item["text"],
                "metadata": item["metadata"],
                "similarity": float(similarity)
            })
            
        # Sort by similarity descending
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

    def save(self):
        """Saves vector store to disk."""
        data = {
            "items": self.items,
            "fallback_vocabulary": self.fallback_vocabulary
        }
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def load(self):
        """Loads vector store from disk."""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.items = data.get("items", [])
                    self.fallback_vocabulary = data.get("fallback_vocabulary", {})
            except Exception as e:
                print(f"Error loading vector store: {e}")
                self.items = []
                self.fallback_vocabulary = {}
