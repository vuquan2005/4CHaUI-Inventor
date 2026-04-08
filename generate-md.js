const fs = require("fs").promises;
const path = require("path");

// --- CẤU HÌNH ---
const CONFIG = {
    IMAGE_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"],
    MD_FILENAME: "README.md",
    REPO_NAME: "tên-repo-của-bạn", // Thay bằng tên repo của bạn
    // Cấu trúc link raw của GitHub: https://raw.githubusercontent.com/<username>/<repo>/<branch>
    GITHUB_RAW_BASE: `https://raw.githubusercontent.com/vuquan2005/${CONFIG.REPO_NAME}/main`,
};

// --- CÁC HÀM TIỆN ÍCH (UTILITIES) ---

/**
 * Lấy danh sách các thư mục con trong một thư mục
 */
async function getSubDirectories(baseDir) {
    const items = await fs.readdir(baseDir, { withFileTypes: true });
    return items.filter((item) => item.isDirectory()).map((item) => item.name);
}

/**
 * Kiểm tra xem một đường dẫn có phải là thư mục và có tồn tại không
 */
async function isDirectoryExists(dirPath) {
    try {
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
    } catch (err) {
        if (err.code === "ENOENT") return false;
        throw err; // Ném lỗi nếu là lỗi khác (ví dụ: thiếu quyền truy cập)
    }
}

/**
 * Lấy danh sách các file ảnh trong một thư mục
 */
async function getImageFiles(dirPath) {
    const files = await fs.readdir(dirPath);
    return files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return CONFIG.IMAGE_EXTENSIONS.includes(ext);
    });
}

// --- CÁC HÀM TẠO NỘI DUNG (GENERATORS) ---

/**
 * Tạo nội dung chuỗi Markdown cho ảnh
 */
function generateMarkdownLinks(imageFiles) {
    let content = "";
    imageFiles.forEach((img) => {
        content += `![${img}](img/${img})\n\n`;
    });
    return content;
}

/**
 * Tạo nội dung chuỗi MyBB (BBCode) sử dụng link GitHub, bọc trong thẻ <details>
 */
function generateMyBBLinks(parentFolderName, imageFiles) {
    let content = "";

    // Mở thẻ details và summary
    content += `<details>\n`;
    content += `<summary>BBCode</summary>\n\n`;

    // Thêm các link ảnh
    imageFiles.forEach((img) => {
        const githubUrl = `${CONFIG.GITHUB_RAW_BASE}/${parentFolderName}/img/${img}`;
        content += `[img]${githubUrl}[/img]\n\n`;
    });

    // Đóng thẻ details
    content += `</details>\n\n`;

    return content;
}

// --- HÀM XỬ LÝ CHÍNH ---

/**
 * Xử lý tạo file README.md cho một thư mục cụ thể
 */
async function processSingleFolder(folderName, baseDir) {
    const folderPath = path.join(baseDir, folderName);
    const imgDirPath = path.join(folderPath, "img");

    // Bỏ qua nếu không có thư mục 'img'
    const hasImgFolder = await isDirectoryExists(imgDirPath);
    if (!hasImgFolder) return;

    try {
        const imageFiles = await getImageFiles(imgDirPath);

        if (imageFiles.length === 0) {
            console.log(`Bỏ qua: ${imgDirPath} (Không có file ảnh nào)`);
            return;
        }

        // Xây dựng nội dung file
        let fileContent = `# Ảnh của ${folderName}\n\n`;
        fileContent += generateMarkdownLinks(imageFiles);
        fileContent += `---\n\n`;
        fileContent += generateMyBBLinks(folderName, imageFiles);

        // Ghi ra file README.md
        const mdFilePath = path.join(folderPath, CONFIG.MD_FILENAME);
        await fs.writeFile(mdFilePath, fileContent, "utf8");

        console.log(`Đã tạo thành công: ${mdFilePath}`);
    } catch (err) {
        console.error(`Lỗi khi xử lý tại ${folderPath}:`, err);
    }
}

/**
 * Hàm khởi chạy toàn bộ quy trình
 */
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
