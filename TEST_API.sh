#!/bin/bash

# Test OCR API Endpoints

echo "🧪 Testing FoodChain AI OCR API"
echo "================================"

# Test 1: Scan Bill (requires image file)
echo ""
echo "📸 Test 1: Scan Bill"
echo "Usage: curl -X POST -F 'bill=@path/to/image.jpg' http://localhost:5000/api/ocr/scan"
echo ""

# Test 2: Save Items
echo "💾 Test 2: Save Items"
curl -X POST http://localhost:5000/api/ocr/save \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "name": "Rice", "quantity": 50 },
      { "name": "Oil", "quantity": 10 }
    ]
  }'
echo ""
echo ""

# Test 3: Get All Materials
echo "📦 Test 3: Get All Materials"
curl http://localhost:5000/api/materials
echo ""
echo ""

# Test 4: Add Material Manually
echo "➕ Test 4: Add Material Manually"
curl -X POST http://localhost:5000/api/materials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sugar",
    "quantity": 25,
    "source": "Manual"
  }'
echo ""
echo ""

echo "✅ Tests Complete!"
