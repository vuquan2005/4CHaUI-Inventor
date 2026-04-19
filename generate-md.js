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
        content += `![${img}](img/${img} "${img}")\n\n`;
    });
    return content;
}

function generateMyBBLinks(parentFolderName, imageFiles) {
    let content = "";
    content += `<details>\n`;
    content += `<summary>BBCode</summary>\n\n`;

    content += `\`\`\`\n`;

    const folderUrl = `https://github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/tree/${CONFIG.BRANCH}/${parentFolderName}`;
    content += `[url=${folderUrl}]${parentFolderName}[/url]\n\n`;

    const downloadUrl = `https://github.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/releases/download/${parentFolderName}/${parentFolderName}.zip`;
    content += `[url=${downloadUrl}]${parentFolderName}.zip[/url]\n\n`;

    content += `Link ảnh:\n\n`;

    imageFiles.forEach((img) => {
        const githubUrl = `https://raw.githubusercontent.com/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/${CONFIG.BRANCH}/${parentFolderName}/img/${img}`;
        content += `[img]${githubUrl}[/img]\n\n`;
    });

    content += `\`\`\`\n\n`;

    content += `</details>\n\n`;
    return content;
}

function generateRootSection(folderName, imageFiles) {
    let content = "";
    content += `<details>\n`;
    content += `<summary>${folderName}</summary>\n\n`;

    imageFiles.forEach((img) => {
        content += `![${img}](${folderName}/img/${img} "${img}")\n\n`;
    });

    content += `</details>\n\n`;
    return content;
}

async function writeRootReadme(foldersData, baseDir) {
    let fileContent = `# ${CONFIG.REPO_NAME}\n\n`;

    foldersData.forEach(({ folderName, imageFiles }) => {
        fileContent += generateRootSection(folderName, imageFiles);
    });

    const rootReadmePath = path.join(baseDir, CONFIG.MD_FILENAME);
    await fs.writeFile(rootReadmePath, fileContent, "utf8");
    console.log(`Đã tạo thành công: ${rootReadmePath}`);
}

// --- HÀM XỬ LÝ CHÍNH ---

async function processSingleFolder(folderName, baseDir) {
    const folderPath = path.join(baseDir, folderName);
    const imgDirPath = path.join(folderPath, "img");

    const hasImgFolder = await isDirectoryExists(imgDirPath);
    if (!hasImgFolder) return null;

    try {
        const imageFiles = await getImageFiles(imgDirPath);

        if (imageFiles.length === 0) {
            console.log(`Bỏ qua: ${imgDirPath} (Không có file ảnh nào)`);
            return null;
        }

        // Xây dựng nội dung file
        let fileContent = `# ${folderName}\n\n`;

        fileContent += generateDownloadLink(folderName);

        fileContent += generateMyBBLinks(folderName, imageFiles);

        fileContent += `## 📷 Hình ảnh\n\n`;

        fileContent += generateMarkdownLinks(imageFiles);

        const mdFilePath = path.join(folderPath, CONFIG.MD_FILENAME);
        await fs.writeFile(mdFilePath, fileContent, "utf8");

        console.log(`Đã tạo thành công: ${mdFilePath}`);
        return { folderName, imageFiles };
    } catch (err) {
        console.error(`Lỗi khi xử lý tại ${folderPath}:`, err);
        return null;
    }
}

async function startProcess() {
    const baseDir = __dirname;

    try {
        const directories = await getSubDirectories(baseDir);
        const foldersData = [];

        for (const folderName of directories) {
            const folderData = await processSingleFolder(folderName, baseDir);
            if (folderData) {
                foldersData.push(folderData);
            }
        }

        if (foldersData.length > 0) {
            await writeRootReadme(foldersData, baseDir);
        } else {
            console.log("Không có thư mục nào có ảnh để tạo README gốc.");
        }

        console.log("✅ Quá trình tạo file markdown đã hoàn tất!");
    } catch (error) {
        console.error("❌ Lỗi hệ thống khi quét thư mục gốc:", error);
    }
}

// Chạy script
startProcess();
