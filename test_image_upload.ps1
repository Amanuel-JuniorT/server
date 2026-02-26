$token = "12|cHqUtG71eIBSQmTFi3OTyptprhMU1KKu3VU7kMdpedbe1452"
$uri = "http://localhost:8000/api/passenger/edit-profile"
$imagePath = "C:/Users/Home/.gemini/antigravity/brain/4cbb7dce-8092-4684-8b29-0dbd22f250d1/test_profile_picture_1766651919259.png"

Write-Host "Test 3: Uploading profile picture..." -ForegroundColor Cyan

Add-Type -AssemblyName System.Net.Http

$httpClient = New-Object System.Net.Http.HttpClient
$httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer $token")
$httpClient.DefaultRequestHeaders.Add("Accept", "application/json")

$multipartContent = New-Object System.Net.Http.MultipartFormDataContent

# Add the file
$fileStream = [System.IO.File]::OpenRead($imagePath)
$fileContent = New-Object System.Net.Http.StreamContent($fileStream)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
$multipartContent.Add($fileContent, "profile_picture", "test_profile.png")

try {
    $response = $httpClient.PostAsync($uri, $multipartContent).Result
    $responseContent = $response.Content.ReadAsStringAsync().Result
    
    if ($response.IsSuccessStatusCode) {
        Write-Host "Success!" -ForegroundColor Green
        Write-Host $responseContent
    } else {
        Write-Host "Error: $($response.StatusCode)" -ForegroundColor Red
        Write-Host $responseContent
    }
} catch {
    Write-Host "Exception:" -ForegroundColor Red
    Write-Host $_.Exception.Message
} finally {
    $fileStream.Close()
    $httpClient.Dispose()
}
