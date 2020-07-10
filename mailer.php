<?php
// Ce fichier envoie un email de contact à info.air@atmosud.org
 
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);
$email = $_POST['contact']['email'];
$message = $_POST['contact']['message'];

header('Content-Type: application/json');

if(isset($email) && isset($message)) {
    try {
        $mail->IsSMTP();
        $mail->CharSet = 'UTF-8';
        $mail->setLanguage('fr');
    
        $mail->Host       = "smtp-relay.sendinblue.com";
        $mail->SMTPDebug  = 0;                     
        $mail->SMTPAuth   = true;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;                  
        $mail->Port       = 587;                   
        $mail->Username   = "suzy.rios@atmosud.org"; 
        $mail->Password   = "ZFCQ1V4yzdIW3qR2";        
    
        $mail->setFrom($email, 'Utilisateur SmartPort');
        $mail->addAddress('guillaume.zehren@live.fr', 'AtmoSud');   
            
        $mail->isHTML(false);                                  
        $mail->Subject = 'SmartPort | Contact';
        $mail->Body = $message;
    
        $mail->send();
    
        $response[] = array(
            'status' => 'true',
            'desc' => 'request success',
        );
    
        echo json_encode(array('response' => $response));

    } catch (Exception $e) {
        
        $response[] = array(
            'status' => 'false',
            'desc' => 'request failed',
        );
    
        echo json_encode(array('response' => $response));
    }
} else {
    $response[] = array(
        'status' => 'false',
        'desc' => 'request failed',
    );

    echo json_encode(array('response' => $response));
}   



