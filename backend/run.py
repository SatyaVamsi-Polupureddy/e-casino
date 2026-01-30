import uvicorn

if __name__ == "__main__":
    print("🎰 Starting Casino Backend System...")
    print("🔒 Swagger Docs available at: http://localhost:8000/docs")
    print("-------------------------------------------------------")
    # Reload=True allows you to change code and see updates instantly
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)