package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

type Response struct {
	Service string      `json:"service"`
	Data    interface{} `json:"data"`
	Error   string      `json:"error,omitempty"`
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	helloServiceURL := os.Getenv("HELLO_SERVICE_URL")
	if helloServiceURL == "" {
		helloServiceURL = "http://hello-service"
	}

	counterServiceURL := os.Getenv("COUNTER_SERVICE_URL")
	if counterServiceURL == "" {
		counterServiceURL = "http://counter-service"
	}

	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		proxyRequest(w, r, helloServiceURL, "hello-service")
	})

	http.HandleFunc("/counter", func(w http.ResponseWriter, r *http.Request) {
		proxyRequest(w, r, counterServiceURL+"/count", "counter-service")
	})

	http.HandleFunc("/counter/increment", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		proxyRequest(w, r, counterServiceURL+"/increment", "counter-service")
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	})

	log.Printf("API Gateway starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func proxyRequest(w http.ResponseWriter, r *http.Request, targetURL string, serviceName string) {
	client := &http.Client{}
	
	var req *http.Request
	var err error
	
	if r.Method == http.MethodPost {
		req, err = http.NewRequest(http.MethodPost, targetURL, r.Body)
	} else {
		req, err = http.NewRequest(http.MethodGet, targetURL, nil)
	}
	
	if err != nil {
		respondWithError(w, serviceName, fmt.Sprintf("Failed to create request: %v", err))
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		respondWithError(w, serviceName, fmt.Sprintf("Failed to reach service: %v", err))
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		respondWithError(w, serviceName, fmt.Sprintf("Failed to read response: %v", err))
		return
	}

	var data interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		respondWithError(w, serviceName, fmt.Sprintf("Failed to parse response: %v", err))
		return
	}

	response := Response{
		Service: serviceName,
		Data:    data,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	json.NewEncoder(w).Encode(response)
}

func respondWithError(w http.ResponseWriter, serviceName string, errorMsg string) {
	response := Response{
		Service: serviceName,
		Error:   errorMsg,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadGateway)
	json.NewEncoder(w).Encode(response)
}
