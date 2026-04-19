# --- CẤU HÌNH ---
$CONFIG = @{
    IMAGE_EXTENSIONS = ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"
    MD_FILENAME      = "README.md"
    GITHUB_USERNAME  = "vuquan2005"
    REPO_NAME        = "4CHaUI-Inventor"
    BRANCH           = "main"
}

# --- HÀM TIỆN ÍCH ---

function Get-ImageFiles($dirPath) {
    if (-not (Test-Path $dirPath)) { return $null }
    return Get-ChildItem -Path $dirPath | Where-Object { 
        $CONFIG.IMAGE_EXTENSIONS -contains $_.Extension.ToLower() 
    }
}

# --- HÀM TẠO NỘI DUNG ---

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8NoBomFile($path, $content) {
    [System.IO.File]::WriteAllText($path, $content, $Utf8NoBom)
}

function Get-DownloadLink($folderName) {
    $url = "https://github.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/releases/download/$folderName/$folderName.zip"
    return "[📥 Tải $folderName]($url)`n`n"
}

function Get-MyBBLinks($folderName, $imageFiles) {
    $content = "<details>`n<summary>BBCode</summary>`n`n"
    $content += "```````n"
    
    $folderUrl = "https://github.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/tree/$($CONFIG.BRANCH)/$folderName"
    $content += "[url=$folderUrl]$folderName[/url]`n`n"
    
    $downloadUrl = "https://github.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/releases/download/$folderName/$folderName.zip"
    $content += "[url=$downloadUrl]$folderName.zip[/url]`n`n"
    
    $content += "Link ảnh:`n`n"
    foreach ($img in $imageFiles) {
        $imgUrl = "https://raw.githubusercontent.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/$($CONFIG.BRANCH)/$folderName/img/$($img.Name)"
        $content += "[img]$imgUrl[/img]`n`n"
    }
    
    $content += "```````n`n</details>`n`n"
    return $content
}

function Get-RootSection($folderName, $imageFiles) {
    $content = "<details>`n<summary>$folderName</summary>`n`n"
    foreach ($img in $imageFiles) {
        $content += "![$($img.Name)]($folderName/img/$($img.Name) `"$($img.Name)`")`n`n"
    }
    $content += "</details>`n`n"
    return $content
}

# --- XỬ LÝ CHÍNH ---

$baseDir = Get-Location
$subDirs = Get-ChildItem -Path $baseDir -Directory
$foldersData = @()

Write-Host "🚀 Bắt đầu quét thư mục..." -ForegroundColor Cyan

foreach ($dir in $subDirs) {
    $folderName = $dir.Name
    $imgDirPath = Join-Path $dir.FullName "img"
    
    if (Test-Path $imgDirPath) {
        $imageFiles = Get-ImageFiles $imgDirPath
        
        if ($imageFiles -and $imageFiles.Count -gt 0) {
            Write-Host "Processing: $folderName" -ForegroundColor Yellow
            
            # Tạo nội dung cho README con
            $subMdContent = "# $folderName`n`n"
            $subMdContent += Get-DownloadLink $folderName
            $subMdContent += Get-MyBBLinks $folderName $imageFiles
            $subMdContent += "## 📷 Hình ảnh`n`n"
            
            foreach ($img in $imageFiles) {
                $subMdContent += "![$($img.Name)](img/$($img.Name) `"$($img.Name)`")`n`n"
            }
            
            # Ghi file README con
            $subMdPath = Join-Path $dir.FullName $CONFIG.MD_FILENAME
            Write-Utf8NoBomFile -path $subMdPath -content $subMdContent

            # Lưu dữ liệu để làm README gốc
            $foldersData += [PSCustomObject]@{
                FolderName = $folderName
                ImageFiles = $imageFiles
            }
        }
    }
}

# Tạo README gốc
if ($foldersData.Count -gt 0) {
    $rootMdContent = "# $($CONFIG.REPO_NAME)`n`n"
    foreach ($data in $foldersData) {
        $rootMdContent += Get-RootSection $data.FolderName $data.ImageFiles
    }
    
    $rootMdPath = Join-Path $baseDir $CONFIG.MD_FILENAME
    Write-Utf8NoBomFile -path $rootMdPath -content $rootMdContent
    Write-Host "✅ Đã tạo thành công README gốc: $rootMdPath" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Không tìm thấy thư mục nào hợp lệ." -ForegroundColor Red
}

Write-Host "🏁 Hoàn tất!" -ForegroundColor Cyan