const LIFF_ID = "2010646520-HSdNTYeC";

const API_URL =
"https://script.google.com/macros/s/AKfycbwWDvTyjfJP9yYY-j1VoQvwH06_gkCroRnrSxMPiBzDHOdDTVE3C_uk654F8XEL1mBj/exec";


let lineUser = "";
let currentBill = null;


// =======================
// LINE LOGIN
// =======================

async function init(){

    await liff.init({
        liffId: LIFF_ID
    });


    if(!liff.isLoggedIn()){

        liff.login();
        return;

    }


    const profile =
    await liff.getProfile();


    lineUser =
    profile.displayName;


    document.getElementById("lineName").innerText =
    "สวัสดี " + lineUser;


}



// =======================
// SAVE USER
// =======================

function saveUser(){

    const id =
    document.getElementById("studentId").value;


    if(!id){

        alert("กรอกเลขนักศึกษาก่อน");
        return;

    }


    localStorage.setItem("studentId",id);

    localStorage.setItem("lineName",lineUser);



    document.getElementById("login")
    .classList.add("hidden");


    document.getElementById("home")
    .classList.remove("hidden");



    document.getElementById("user").innerText =
    "👤 " + lineUser + " | " + id;



    loadBills();

}



// =======================
// LOAD BILLS
// =======================

async function loadBills(){


    const studentId =
    localStorage.getItem("studentId");



    const res =
    await fetch(
        API_URL +
        "?action=getBills&studentId=" +
        studentId
    );



    const data =
    await res.json();



    let html = "";



    if(data.bills.length===0){

        html="ยังไม่มีรายการ";

    }



    data.bills.forEach(b=>{


        let date =
        new Date(b.month)
        .toLocaleDateString(
            "th-TH",
            {
                year:"numeric",
                month:"long"
            }
        );



        html += `

        <div class="item"
        onclick='openBill(${JSON.stringify(b)})'>


        📅 ${date}<br>


        ${b.title}<br>


        💵 ${b.amount} บาท<br>


        สถานะ :
        ${b.status || "ยังไม่จ่าย"}


        </div>

        `;


    });



    document.getElementById("billList")
    .innerHTML = html;


}



// =======================
// OPEN BILL
// =======================

function openBill(b){


    currentBill = b;



    document.getElementById("home")
    .classList.add("hidden");



    document.getElementById("detail")
    .classList.remove("hidden");



    document.getElementById("title").innerText =
    b.title;



    document.getElementById("amount").innerText =
    b.amount;



    document.getElementById("billStatus").innerText =
    "สถานะ : " +
    (b.status || "ยังไม่จ่าย");



    document.getElementById("qr").src =
    b.qr;



    document.getElementById("slip").value="";



    document.getElementById("preview").src="";



    document.getElementById("preview")
    .classList.add("hidden");


}



// =======================
// PREVIEW SLIP
// =======================

function previewSlip(event){


    const file =
    event.target.files[0];



    if(!file) return;



    const reader =
    new FileReader();



    reader.onload=function(e){


        document.getElementById("preview")
        .src =
        e.target.result;



        document.getElementById("preview")
        .classList.remove("hidden");


    }



    reader.readAsDataURL(file);


}



// =======================
// UPLOAD SLIP
// =======================

async function uploadSlip(){


    const file =
    document.getElementById("slip")
    .files[0];



    if(!file){


        alert("กรุณาเลือกสลิป");

        return;


    }



    const reader =
    new FileReader();



    reader.onload = async function(e){



        const base64 =
        e.target.result.split(",")[1];



        const body = {


            action:"payment",


            studentId:
            localStorage.getItem("studentId"),


            billId:
            currentBill.billId,


            slip:
            base64


        };



        alert("กำลังส่งสลิป...");



        try{


            const res =
            await fetch(API_URL,{


                method:"POST",


                headers:{


                    "Content-Type":"application/json"


                },


                body:
                JSON.stringify(body)


            });



            const data =
            await res.json();



            console.log(data);



            if(data.success){


                alert("ส่งสลิปเรียบร้อย");


            }else{


                alert(
                "ส่งไม่สำเร็จ\n"+
                data.error
                );


            }



        }catch(err){


            console.log(err);


            alert("เกิดข้อผิดพลาดในการส่ง");


        }



    };



    reader.readAsDataURL(file);



}





// =======================
// BACK
// =======================

function back(){


    document.getElementById("detail")
    .classList.add("hidden");



    document.getElementById("home")
    .classList.remove("hidden");


}



init();
