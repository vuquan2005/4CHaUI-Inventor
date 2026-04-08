const fs = require("fs").promises;
const path = require("path");

// --- CẤU HÌNH ---
const CONFIG = {
    IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"],
    MD_FILENAME: "README.md",
    GITHUB_USERNAME: "vuquan2005", // Thay username nếu cần
    REPO_NAME: "4CHaUI-Inventor", // <-- ĐIỀN TÊN REPO VÀO ĐÂY
    BRANCH: "main",
};

// --- CÁC HÀM TIỆN ÍCH (UTILITIES) ---

async function getSubDirectories(baseDir) {
    const items = await fs.readdir(baseDir, { withFileTypes: true });
    return items.filter((item) => item.isDirectory()).map((item) => item.name);
}

async function isDirectoryExists(dirPath) {
    try {
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
    } catch (err) {
        if (err.code === "ENOENT") return false;
        throw err;
    }
}

async function getImageFiles(dirPath) {
    const files = await fs.readdir(dirPath);
    return files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return CONFIG.IMAGE_EXTENSIONS.includes(ext);
    });
}

// --- CÁC HÀM TẠO NỘI DUNG (GENERATORS) ---

/**
 * MỚI: Tạo nội dung link tải Release từ GitHub
 */
function generateDownloadLink(folderName) {
    const downloadUrl = `https://github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/releases/download/${folderName}/${folderName}.zip`;
    return `[📥 Tải ${folderName}](${downloadUrl})\n\n`;
}

function generateMarkdownLinks(imageFiles) {
    let content = "";
    imageFiles.forEach((img) => {
        content += `![${img}](img/${img})\n\n`;
    });
    return content;
}

function generateMyBBLinks(parentFolderName, imageFiles) {
    let content = "";
    content += `<details>\n`;
    content += `<summary>BBCode</summary>\n\n`;

    const downloadUrl = `https://github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/releases/download/${parentFolderName}/${parentFolderName}.zip\n\n`;
    content += `${downloadUrl}`;

    content += `Ảnh:\n\n`;

    imageFiles.forEach((img) => {
        const githubUrl = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/refs/heads/${CONFIG.BRANCH}/${parentFolderName}/img/${img}`;
        content += `[img]${githubUrl}[/img]\n\n`;
    });

    content += `</details>\n\n`;
    return content;
}

// --- HÀM XỬ LÝ CHÍNH ---

async function processSingleFolder(folderName, baseDir) {
    const folderPath = path.join(baseDir, folderName);
    const imgDirPath = path.join(folderPath, "img");

    const hasImgFolder = await isDirectoryExists(imgDirPath);
    if (!hasImgFolder) return;

    try {
        const imageFiles = await getImageFiles(imgDirPath);

        if (imageFiles.length === 0) {
            console.log(`Bỏ qua: ${imgDirPath} (Không có file ảnh nào)`);
            return;
        }

        // Xây dựng nội dung file
        let fileContent = `# ${folderName}\n\n`;

        fileContent += generateDownloadLink(folderName);
        fileContent += `---\n\n`;

        fileContent += `## 📷 Hình ảnh\n\n`;

        fileContent += generateMarkdownLinks(imageFiles);
        fileContent += `---\n\n`;

        fileContent += generateMyBBLinks(folderName, imageFiles);

        const mdFilePath = path.join(folderPath, CONFIG.MD_FILENAME);
        await fs.writeFile(mdFilePath, fileContent, "utf8");

        console.log(`Đã tạo thành công: ${mdFilePath}`);
    } catch (err) {
        console.error(`Lỗi khi xử lý tại ${folderPath}:`, err);
    }
}

async function startProcess() {
    const baseDir = __dirname;

    try {
        const directories = await getSubDirectories(baseDir);

        for (const folderName of directories) {
            await processSingleFolder(folderName, baseDir);
        }

        console.log("✅ Quá trình tạo file markdown đã hoàn tất!");
    } catch (error) {
        console.error("❌ Lỗi hệ thống khi quét thư mục gốc:", error);
    }
}

// Chạy script
startProcess();
