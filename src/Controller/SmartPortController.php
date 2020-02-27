<?php

namespace App\Controller;


use App\Entity\UserMesures;
use App\Form\UserMesuresType;
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
    *@Route("/map", name="map")
    */
    public function map(Request $request, ObjectManager $manager)
    {
        $mesures = new UserMesures;

        $form = $this->createForm(UserMesuresType::class, $mesures);
        
        $form->handleRequest($request);

        if($form->isSubmitted() && $form->isValid()) {
        
            $manager->persist($mesures);
            $manager->flush();

            return $this->redirectToRoute('map');
        }

        return $this->render('smart_port/map.html.twig', [
            'form' => $form->createView()
        ]);
    }

    
    /**
    *@Route("/api/map/users/mesures", name="get_mesures_api")
    */
    public function mapUsersMesuresApi(UserMesuresRepository $repo) 
    {
        $mesures = $repo->findAll();

        if($mesures) {
            foreach($mesures as $mesure) {
                $results[] = array($mesure->getLon(), $mesure->getLat(), $mesure->getPolluant(), $mesure->getUsername(), $mesure->getDate()); 
            }

            return $this->json(['results' => json_encode($results)]);
        }

        return $this->json(['code' => 500]);
    }

    /**
    *@Route("/api/add/mesures", name="add_mesures_api")
    */
    public function addMesuresApi(Request $request, ObjectManager $manager, UserMesuresRepository $userMesRepo) 
    {
        if($request->isXmlHttpRequest()) {

            $mesures = new UserMesures();

            $form = $this->createForm(UserMesuresType::class, $mesures);
            $form->handleRequest($request);

            if($form->isValid()) {
                $mesures->getPolluant();
                $mesures->getDate();
                $lon = $mesures->getLon();
                $lat = $mesures->getLat();
                $mesures->setUsername($this->getUser()->getUsername());

                if(!$this->validateLatLong($lat, $lon)) {
                    return new JsonResponse(['status' => 300]);
                }
               
                try {
                    $file = $_FILES['file'];
    
                    $file = new UploadedFile($file['tmp_name'], $file['name'], $file['type']);
        
                    $filename = $this->getUser()->getUsername() . '_mesures' .'.' . 'json';

                    if($userMesRepo->findOneBy(['file_adress' => $filename])) {
                        return $this->json(['status' => 450]);
                    }

                    $file->move(
                        $this->getParameter('mesures_directory'),
                        $filename
                    );
    
                    $mesures->setFileAdress($filename);
    
                    $manager->persist($mesures);
    
                    $manager->flush();
        
                } catch(FileException $e) {
                    $e->getMessage();
                }

                return $this->json([
                    'status' => 200,
                    'lon' => $mesures->getLon(),
                    'lat' => $mesures->getLat(),
                    'file_address' => $mesures->getFileAdress(),
                    'user' => $this->getUser()->getUsername(),
                    'polluant' => $mesures->getPolluant(),
                    'date' => $mesures->getDate()
                ]);
            }
            return $this->json([
                'status' => 500,
                'error' => $this->getErrorMessages($form)]);
        }
    }

    /**
    *@Route("/api/map", name="mapAPI")
    */
    public function mapAPI(Request $request) : Response
    {  
        $connexionParams = "host=78.153.226.3 port=5432 dbname=smartport user=smartportuser password=smartport";
        $db = pg_connect($connexionParams);
                
        $sql = pg_query($db, "SELECT nom, lon, lat, id FROM site");

        $results = array();

        while($row = pg_fetch_row($sql)) {
            $results[] = $row; 
        } 

        return $this->json(['code' => 200, 'results' => json_encode($results)], 200);
    }

    /**
     * @Route("/map/ihs/api", name="map_api_ihs")
     */
    public function getIHSdata() : Response {

      $connexionParams = "host=78.153.226.3 port=5432 dbname=ihs user=readonly password=GNQ4$3";
      
      $db = pg_connect($connexionParams);

      $date = new \DateTime();
      $date->modify('-1 hour');
      $formatDate = $date->format("Y-m-d H:00:00");

      $sql = "SELECT \"Name\", \"Lon\", \"Lat\", \"VesselType\", \"Destination\", \"Status\", \"Heading\", \"Width\" FROM loc.horaire WHERE upload_hour >= '$formatDate' AND \"VesselType\" != 'Vessel'";
              
      $sql = pg_query($db, $sql);

      $results = array();

      while($row = pg_fetch_row($sql)) {
          $results[] = $row; 
      } 

      if(($results)) {
          return new JsonResponse([
              'code' => 200,
              'results' => json_encode($results),
          ]);
      } else {
          return new JsonResponse([
              'code' => 500,
          ]);
      }
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

    private function validateLatLong($lat, $long) 
    {
        return preg_match('/^[-]?((([0-8]?[0-9])(\.(\d+))?)|(90(\.0+)?)),[-]?((((1[0-7][0-9])|([0-9]?[0-9]))(\.(\d+))?)|180(\.0+)?)$/', $lat.','.$long);
    }

    protected function getErrorMessages(\Symfony\Component\Form\Form $form) 
    {
        $errors = array();

        foreach ($form->getErrors() as $key => $error) {
            $errors[] = $error->getMessage();
        }

        foreach ($form->all() as $child) {
            if (!$child->isValid()) {
                $errors[$child->getName()] = $this->getErrorMessages($child);
            }
        }

        return $errors;
    }
}



