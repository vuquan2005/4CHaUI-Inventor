# --- CẤU HÌNH ---
$CONFIG = @{
    IMAGE_EXTENSIONS = ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"
    MD_FILENAME      = "README.md"
    GITHUB_USERNAME  = "vuquan2005"
    REPO_NAME        = "4CHaUI-Inventor"
    BRANCH           = "main"
}

# --- HÀM TIỆN ÍCH ---

function Get-SubDirectories($baseDir) {
    function Get-SubDirectoriesRecursive($currentDir) {
        $items = Get-ChildItem -Path $currentDir
        
        # Kiểm tra xem thư mục hiện tại có file .ipj nào không
        $hasIpj = $false
        foreach ($item in $items) {
            if (-not $item.PSIsContainer -and $item.Extension.ToLower() -eq '.ipj') {
                $hasIpj = $true
                break
            }
        }
        
        if ($hasIpj -and $currentDir -ne $baseDir) {
            # Nếu có, thêm đường dẫn tương đối vào kết quả
            $relativePath = $currentDir.Substring($baseDir.Length + 1).Replace('\', '/')
            Write-Output $relativePath
        } else {
            # Nếu không, tiếp tục quét các thư mục con
            foreach ($item in $items) {
                if ($item.PSIsContainer -and $item.Name -ne 'node_modules' -and -not $item.Name.StartsWith('.')) {
                    Get-SubDirectoriesRecursive $item.FullName
                }
            }
        }
    }
    
    Get-SubDirectoriesRecursive $baseDir
}

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

function Get-DownloadLink($folderName, $releaseName) {
    $url = "https://github.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/releases/download/$releaseName/$releaseName.zip"
    return "[📥 Tải $folderName]($url)`n`n"
}

function Get-MyBBLinks($folderName, $releaseName, $imageFiles) {
    $content = "<details>`n<summary>BBCode</summary>`n`n"
    $content += "```````n"
    
    $folderUrl = "https://github.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/tree/$($CONFIG.BRANCH)/$folderName"
    $content += "[url=$folderUrl]$folderName[/url]`n`n"
    
    $downloadUrl = "https://github.com/$($CONFIG.GITHUB_USERNAME)/$($CONFIG.REPO_NAME)/releases/download/$releaseName/$releaseName.zip"
    $content += "[url=$downloadUrl]$releaseName.zip[/url]`n`n"
    
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

$baseDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($baseDir)) {
    $baseDir = (Get-Location).Path
}

$directories = Get-SubDirectories $baseDir
$foldersData = @()

foreach ($folderName in $directories) {
    $folderPath = Join-Path $baseDir $folderName
    $imgDirPath = Join-Path $folderPath "img"
    
    if (Test-Path $imgDirPath) {
        $baseName = Split-Path -Leaf $folderPath
        $ipjFile = Get-ChildItem -Path $folderPath -File | Where-Object { $_.Extension.ToLower() -eq '.ipj' } | Select-Object -First 1
        
        if ($ipjFile) {
            $ipjName = $ipjFile.BaseName
            if ($ipjName -ne $baseName) {
                Write-Host "`n⚠️ CẢNH BÁO: Tên thư mục `"$baseName`" khác với tên file project `"$($ipjFile.Name)`". Điều này có thể gây nhầm lẫn!`n" -ForegroundColor Yellow
            }
        }

        $imageFiles = Get-ImageFiles $imgDirPath
        
        if ($imageFiles -and $imageFiles.Count -gt 0) {
            
            # Tạo nội dung cho README con
            $subMdContent = "# $folderName`n`n"
            $subMdContent += Get-DownloadLink $folderName $baseName
            $subMdContent += Get-MyBBLinks $folderName $baseName $imageFiles
            $subMdContent += "## 📷 Hình ảnh`n`n"
            
            foreach ($img in $imageFiles) {
                $subMdContent += "![$($img.Name)](img/$($img.Name) `"$($img.Name)`")`n`n"
            }
            
            # Ghi file README con
            $subMdPath = Join-Path $folderPath $CONFIG.MD_FILENAME
            Write-Utf8NoBomFile -path $subMdPath -content $subMdContent

            # Lưu dữ liệu để làm README gốc
            $foldersData += [PSCustomObject]@{
                FolderName = $folderName
                ImageFiles = $imageFiles
            }
            
            Write-Host "Đã tạo thành công: $subMdPath"
        }
        else {
            Write-Host "Bỏ qua: $imgDirPath (Không có file ảnh nào)"
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
    Write-Host "Đã tạo thành công: $rootMdPath"
}
else {
    Write-Host "Không có thư mục nào có ảnh để tạo README gốc."
}

Write-Host "✅ Quá trình tạo file markdown đã hoàn tất!" -ForegroundColor Cyan