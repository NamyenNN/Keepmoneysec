const LIFF_ID = "2010646520-HSdNTYeC"; 
// ⚠️ อย่าลืมอัปเดต API_URL ใหม่ ถ้าเพิ่ง Deploy GAS เป็น New Version
const API_URL = "https://script.google.com/macros/s/AKfycbxWXZ1mCsujKlr0ACgY2P7uElphWEUU038dEzXmK9ZUuOaIaFJR50eYcs3gwNl-3DV4Pg/exec";

let lineUser = "";
let lineId = "";
let currentBill = null;

// ================= INIT =================
async function init(){
    try{
        await liff.init({ liffId: LIFF_ID });

        if(!liff.isLoggedIn()){
            liff.login();
            return;
        }

        const profile = await liff.getProfile();
        lineUser = profile.displayName;
        lineId = profile.userId;

        localStorage.setItem("lineId", lineId);
        localStorage.setItem("lineName", lineUser);

        document.getElementById("lineName").innerText = "สวัสดี " + lineUser;

        const oldStudent = localStorage.getItem("studentId");
        if(oldStudent){
            showHome(oldStudent);
        }
    }catch(err){
        console.log("LIFF Init Error: ", err);
        alert("เกิดปัญหาในการเชื่อมต่อ LINE: " + err);
    }
}

// ================= SAVE USER =================
async function saveUser(){
    const studentId = document.getElementById("studentId").value;
    if(!studentId){
        alert("กรอกรหัสนักศึกษาก่อน");
        return;
    }

    localStorage.setItem("studentId", studentId);

    await fetch(API_URL,{
        method:"POST",
        headers:{ "Content-Type":"text/plain;charset=utf-8" },
        body:JSON.stringify({
            action:"saveLineUser",
            lineId:lineId,
            displayName:lineUser,
            studentId:studentId
        })
    });

    showHome(studentId);
}

// ================= HOME =================
function showHome(id){
    document.getElementById("login").classList.add("hidden");
    document.getElementById("home").classList.remove("hidden");
    document.getElementById("user").innerText = "👤 "+lineUser+" | "+id;
    loadBills();
}

// ================= LOAD BILL =================
async function loadBills(){
    const id = localStorage.getItem("studentId");
    
    try {
        const res = await fetch(API_URL + "?action=getBills&studentId=" + id + "&t=" + Date.now());
        const data = await res.json();

        console.log("ข้อมูลจาก Apps Script =", data);

        let html="";

        if(!data.bills || data.bills.length===0){
            html="ยังไม่มีรายการ";
        } else {
            data.bills.forEach(b=>{
                html += `
                <div class="item" onclick='openBill(${JSON.stringify(b)})'>
                📅 ${b.month}<br>
                ${b.title}<br>
                💵 ${b.amount} บาท<br>
                สถานะ : ${b.status}
                </div>
                `;
            });
        }
        document.getElementById("billList").innerHTML = html;
    } catch(err) {
        console.log(err);
        document.getElementById("billList").innerHTML = "โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชใหม่นะ";
    }
}

// ================= OPEN BILL =================
function openBill(b){
    currentBill = b;
    document.getElementById("home").classList.add("hidden");
    document.getElementById("detail").classList.remove("hidden");

    document.getElementById("title").innerText=b.title;
    document.getElementById("amount").innerText=b.amount;
    document.getElementById("billStatus").innerText="สถานะ : "+b.status;
    document.getElementById("qr").src=b.qr;
}

// ================= COMPRESS IMAGE (ฟังก์ชันใหม่! ช่วยให้สลิปส่งผ่าน) =================
function compressImage(file, maxSize, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // คำนวณขนาดย่อให้ไม่เกิน maxSize (เช่น 800px)
            if (width > height) {
                if (width > maxSize) { height *= maxSize / width; width = maxSize; }
            } else {
                if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            }
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // บีบอัดเป็น JPEG คุณภาพ 60%
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            callback(dataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ================= SEND SLIP =================
async function uploadSlip(){

    const file = document.getElementById("slip").files[0];

    if(!file){
        alert("เลือกสลิปก่อน");
        return;
    }

    if(!currentBill){
        alert("ไม่พบบิล");
        return;
    }


    compressImage(file,800,async function(compressedBase64){

        // ตัด data:image/jpeg;base64, ออก
        const base64 = compressedBase64.split(",")[1];


        const body={

            action:"payment",

            studentId:localStorage.getItem("studentId"),

            billId:currentBill.billId,

            slip:base64,

            fileName:"slip_" + Date.now() + ".jpg",

            mimeType:"image/jpeg"

        };


        try{

            alert("กำลังส่งสลิป รอแป๊บนึงนะ...");


            const res = await fetch(API_URL,{

                method:"POST",

                headers:{
                    "Content-Type":"text/plain;charset=utf-8"
                },

                body:JSON.stringify(body)

            });


            const data = await res.json();


            console.log("ผลส่งสลิป =",data);



            if(data.success){

                alert("ส่งสลิปเรียบร้อย");


                document.getElementById("detail").classList.add("hidden");

                document.getElementById("home").classList.remove("hidden");


                setTimeout(()=>{

                    loadBills();

                },1500);


            }else{

                alert(
                    "ส่งไม่สำเร็จ\n"+
                    data.error
                );

            }


        }catch(err){

            console.log(err);

            alert("ส่งไม่สำเร็จ กรุณาลองใหม่");

        }

    });

}
// ================= DELETE IMAGE (ฟังก์ชันใหม่ เอาไว้ลบรูป) =================
async function deleteImage(fileUrl) {
    if(!confirm("แน่ใจนะว่าจะลบรูปนี้?")) return;

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "deleteSlip",
                fileUrl: fileUrl
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("ลบรูปสำเร็จ!");
            // แกสามารถสั่งโหลดบิลใหม่หรือซ่อนปุ่มตามต้องการได้ที่นี่
        } else {
            alert("ลบไม่สำเร็จ: " + data.message);
        }
    } catch(err) {
        console.log("Delete error: ", err);
        alert("เกิดข้อผิดพลาดในการลบรูป");
    }
}

// ================= BACK =================
function back(){
    document.getElementById("detail").classList.add("hidden");
    document.getElementById("home").classList.remove("hidden");
    loadBills();
}

init();
