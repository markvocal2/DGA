// Global variable for storing current deleting category
let currentDeletingCategory = null;

// Document ready handler
document.addEventListener("DOMContentLoaded", function() {
    // Handle success modal
    const modal = document.getElementById("successModal");
    if (modal) {
        modal.style.display = "block";
    }

    // Handle category select change
    const categorySelect = document.getElementById("page_category");
    const deleteWrapper = document.getElementById("delete-category-btn-wrapper");
    
    if (categorySelect) {
        categorySelect.addEventListener("change", function() {
            const selectedOption = this.options[this.selectedIndex];
            const hasDelete = selectedOption.getAttribute("data-has-delete");
            
            if (hasDelete === "true") {
                // Add trash icon button
                deleteWrapper.innerHTML = `
                    <button type="button" class="delete-category-btn" onclick="deleteCategory(${this.value})" title="ลบหมวดหมู่">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>`;
            } else {
                deleteWrapper.innerHTML = "";
            }
        });
    }
});

// Toggle new category form
function toggleNewCategoryForm() {
    const form = document.getElementById("new-category-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

// Save new category
function saveNewCategory() {
    const categoryName = document.getElementById("new-category-name").value;
    if (!categoryName) {
        alert("กรุณากรอกชื่อหมวดหมู่");
        return;
    }

    const formData = new FormData();
    formData.append("action", "create_new_category");
    formData.append("category_name", categoryName);
    formData.append("nonce", createPageVars.categoryNonce);

    fetch(createPageVars.ajaxurl, {
        method: "POST",
        credentials: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const select = document.getElementById("page_category");
            const newCat = data.data;
            const option = new Option(newCat.name, newCat.id);
            option.setAttribute("data-has-delete", "true");
            select.add(option);
            select.value = newCat.id;

            document.getElementById("new-category-form").style.display = "none";
            document.getElementById("new-category-name").value = "";
            
            alert("เพิ่มหมวดหมู่สำเร็จ");
        } else {
            alert("เกิดข้อผิดพลาด: " + (data.data || 'ไม่สามารถเพิ่มหมวดหมู่ได้'));
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่");
    });
}

// Delete category
function deleteCategory(categoryId) {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้?")) {
        return;
    }

    currentDeletingCategory = categoryId;
    const formData = new FormData();
    formData.append("action", "delete_category");
    formData.append("category_id", categoryId);
    formData.append("nonce", createPageVars.categoryNonce);

    fetch(createPageVars.ajaxurl, {
        method: "POST",
        credentials: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCategorySelect(categoryId);
            alert("ลบหมวดหมู่สำเร็จ");
        } else {
            if (data.data.includes("มีเนื้อหาอยู่")) {
                showDeleteModal();
            } else {
                throw new Error(data.data || 'ไม่สามารถลบหมวดหมู่ได้');
            }
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    });
}

// Modal management functions
function showDeleteModal() {
    const modal = document.getElementById("deleteCategoryModal");
    if (modal) {
        modal.style.display = "block";
    }
}

function closeDeleteModal() {
    const modal = document.getElementById("deleteCategoryModal");
    if (modal) {
        modal.style.display = "none";
    }
    currentDeletingCategory = null;
}

// Move and delete category
function moveAndDeleteCategory() {
    const targetCategory = document.getElementById("moveToCategory").value;
    if (!targetCategory) {
        alert("กรุณาเลือกหมวดหมู่ที่ต้องการย้ายเนื้อหาไป");
        return;
    }

    const formData = new FormData();
    formData.append("action", "move_and_delete_category");
    formData.append("from_category", currentDeletingCategory);
    formData.append("to_category", targetCategory);
    formData.append("nonce", createPageVars.categoryNonce);

    fetch(createPageVars.ajaxurl, {
        method: "POST",
        credentials: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCategorySelect(currentDeletingCategory);
            closeDeleteModal();
            alert("ย้ายเนื้อหาและลบหมวดหมู่สำเร็จ");
        } else {
            throw new Error(data.data || 'ไม่สามารถย้ายเนื้อหาและลบหมวดหมู่ได้');
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    });
}

// Delete category with all content
function deleteWithContent() {
    if (!confirm("คำเตือน: การดำเนินการนี้จะลบเนื้อหาทั้งหมดในหมวดหมู่นี้และไม่สามารถกู้คืนได้\nคุณแน่ใจหรือไม่?")) {
        return;
    }

    const formData = new FormData();
    formData.append("action", "delete_category_with_content");
    formData.append("category_id", currentDeletingCategory);
    formData.append("nonce", createPageVars.categoryNonce);

    fetch(createPageVars.ajaxurl, {
        method: "POST",
        credentials: 'same-origin',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            updateCategorySelect(currentDeletingCategory);
            closeDeleteModal();
            alert("ลบหมวดหมู่และเนื้อหาทั้งหมดสำเร็จ");
        } else {
            throw new Error(data.data || 'ไม่สามารถลบหมวดหมู่และเนื้อหาได้');
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("เกิดข้อผิดพลาด: " + error.message);
    });
}

// Update category select after deletion
function updateCategorySelect(removedCategoryId) {
    const select = document.getElementById("page_category");
    const option = select.querySelector(`option[value="${removedCategoryId}"]`);
    if (option) {
        option.remove();
    }
    select.value = "";
    document.getElementById("delete-category-btn-wrapper").innerHTML = "";
}