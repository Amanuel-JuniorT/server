$token = "12|cHqUtG71eIBSQmTFi3OTyptprhMU1KKu3VU7kMdpedbe1452"
$uri = "http://localhost:8000/api/passenger/edit-profile"

# Test 1: Simple name update
Write-Host "Test 1: Updating name..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
    } -Body @{
        name = "Test User Updated"
    }
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`n---`n"

# Test 2: Email update
Write-Host "Test 2: Updating email..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
    } -Body @{
        email = "newemail@example.com"
    }
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
}
