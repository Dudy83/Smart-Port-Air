<?php

namespace App\Controller;

use App\Entity\UserMesures;
use App\Form\UserMesuresType;
use App\Form\ContactType;
use Doctrine\DBAL\Driver\Connection;
use App\Repository\UserMesuresRepository;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\Common\Persistence\ObjectManager;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;


class SmartPortController extends AbstractController
{
    /**
    *@Route("/", name="smart_port")
    */
    public function index()
    {
        return $this->render('smart_port/index.html.twig');
    }

    /**
    *@Route("/contact", name="contact")
    */
    public function contact(Request $request, \Swift_Mailer $mailer)
    {
        $form = $this->createForm(ContactType::class);

        $form->handleRequest($request);

        if($form->isSubmitted() && $form->isValid()) {
            $email = $form->get('email')->getData();
            $message = $form->get('message')->getData();

            $message = (new \Swift_Message('Contact Smartport'))
            ->setFrom($email)
            ->setTo('guillaume.zehren@atmosud.org')
            ->setBody($message);
    
            $mailer->send($message);

            $this->addFlash(
                'contact_success',
                'Votre message à bien été envoyé !'
            );
        }
        
        return $this->render('smart_port/contact.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
    *@Route("/map", name="map")
    */
    public function map()
    {
        return $this->render('smart_port/map.html.twig');
    }

    /**
     * @Route("/map/ihs/api", name="map_api_ihs")
     */
    public function getIHSdata(Request $request) : Response {

        if($content = $request->getContent()) {

            $parametersAsArray = json_decode($content, true);
           
            $date = $parametersAsArray["value"];

            $connexionParams = "host=78.153.226.3 port=5432 dbname=ihs user=readonly password=GNQ4$3";
      
            $db = pg_connect($connexionParams);
    
      
            $sql = "SELECT \"Name\", \"Lon\", \"Lat\", \"VesselType\", \"Destination\", \"Status\", \"Heading\", \"Width\" FROM loc.horaire WHERE upload_hour = '$date' AND \"VesselType\" != 'Vessel'";
                    
            $sql = pg_query($db, $sql);
      
            $results = array();
      
            while($row = pg_fetch_row($sql)) {
                $results[] = $row; 
            } 
      
            return new JsonResponse([
                'code' => 200,
                'results' => json_encode($results),
            ]);
        }

        return new JsonResponse([
            'code' => 500,
        ]);
           
    }

    /**
    *@Route("/profil", name="profil")
    */
    public function profil()
    {
        $user = $this->getUser();

        $username = $user->getUsername();

        $email = $user->getEmail();

        return $this->render('smart_port/profil.html.twig', [
            'username' => $username,
            'email' => $email,
        ]);
    }
}



