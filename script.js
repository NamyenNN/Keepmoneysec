const LIFF_ID = "2010646520-HSdNTYeC";

const API_URL =
"https://script.google.com/macros/s/AKfycbwWDvTyjfJP9yYY-j1VoQvwH06_gkCroRnrSxMPiBzDHOdDTVE3C_uk654F8XEL1mBj/exec";


let lineUser = "";
let lineId = "";
let currentBill = null;



// =======================
// INIT LINE
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


    lineId =
    profile.userId;



    localStorage.setItem(
        "lineId",
        lineId
    );


    localStorage.setItem(
        "lineName",
        lineUser
    );



    document.getElementById("lineName").innerText =
    "สวัสดี " + lineUser;



    // ถ้ามีข้อมูลเก่า
    const oldID =
    localStorage.getItem("studentId");


    if(oldID){

        showHome(oldID);

    }

}



// =======================
// SAVE USER
// =======================

async function saveUser(){


    const id =
    document.getElementById("studentId").value;



    if(!id){

        alert("กรอกรหัสนักศึกษาก่อน");

        return;

    }



    localStorage.setItem(
        "studentId",
        id
    );



    localStorage.setItem(
        "lineName",
        lineUser
    );



    // บันทึก LINE USER

    await fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action:"saveLineUser",

            lineId:lineId,

            displayName:lineUser,

            studentId:id

        })

    });



    showHome(id);


}




// =======================
// SHOW HOME
// =======================

function showHome(id){


    document.getElementById("login")
    .classList.add("hidden");


    document.getElementById("home")
    .classList.remove("hidden");



    document.getElementById("user").innerText =

    "👤 "
    +
    lineUser
    +
    " | "
    +
    id;



    loadBills();

}



// =======================
// LOAD BILL
// =======================

async function loadBills(){


    const id =
    localStorage.getItem("studentId");



    const res =
    await fetch(

        API_URL
        +
        "?action=getBills&studentId="
        +
        id

    );



    const data =
    await res.json();



    let html="";



    if(!data.bills ||
       data.bills.length===0){


        html="ยังไม่มีรายการ";

    }



    data.bills.forEach(b=>{


        html += `

        <div class="item"
        onclick='openBill(${JSON.stringify(b)})'>


        📅 ${b.month}

        <br>

        ${b.title}

        <br>

        💵 ${b.amount} บาท

        <br>

        สถานะ :
        ${b.status}


        </div>


        `;


    });



    document.getElementById("billList")
    .innerHTML=html;


}



// =======================
// OPEN BILL
// =======================

function openBill(b){


    currentBill=b;



    document.getElementById("home")
    .classList.add("hidden");


    document.getElementById("detail")
    .classList.remove("hidden");



    document.getElementById("title")
    .innerText=b.title;


    document.getElementById("amount")
    .innerText=b.amount;



    document.getElementById("billStatus")
    .innerText=
    "สถานะ : "
    +
    b.status;



    document.getElementById("qr")
    .src=b.qr;


}



// =======================
// PREVIEW
// =======================

function previewSlip(e){


    const file =
    e.target.files[0];


    if(!file)return;



    const reader =
    new FileReader();



    reader.onload=function(x){


        document.getElementById("preview")
        .src=x.target.result;



        document.getElementById("preview")
        .classList.remove("hidden");


    };


    reader.readAsDataURL(file);


}



// =======================
// SEND SLIP
// =======================

async function uploadSlip(){


    const file =
    document.getElementById("slip")
    .files[0];



    if(!file){

        alert("กรุณาเลือกสลิป");

        return;

    }



    if(!currentBill){

        alert("ไม่พบรายการบิล");

        return;

    }



    const reader =
    new FileReader();



    reader.onload=async function(e){



        const body={


            action:"payment",


            studentId:
            localStorage.getItem("studentId"),


            billId:
            currentBill.billId,


            slip:
            e.target.result


        };



        alert("กำลังส่งสลิป...");



        try{


            const res =
            await fetch(API_URL,{

                method:"POST",

                headers:{

                    "Content-Type":
                    "text/plain;charset=utf-8"

                },

                body:
                JSON.stringify(body)

            });



            const data =
            await res.json();



            console.log(data);



            if(data.success){


                alert("ส่งสลิปเรียบร้อย");


                loadBills();


            }else{


                alert(
                    "ส่งไม่สำเร็จ\n"
                    +
                    data.error
                );


            }


        }catch(err){


            console.log(err);

            alert(
            "เกิดข้อผิดพลาดในการส่ง"
            );


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
