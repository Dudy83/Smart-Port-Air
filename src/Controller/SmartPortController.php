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
        // Create connection
        $config = new \Doctrine\DBAL\Configuration();

        $connectionParams = [
            'dbname' => 'smartport',
            'user' => 'root',
            'password' => '',
            'host' => '127.0.0.1:3306',
            'driver' => 'pdo_mysql',
        ];

        $conn = \Doctrine\DBAL\DriverManager::getConnection($connectionParams, $config);
                
        // Prepare the query
        $sql = "SELECT nom, lon, lat, id FROM `chimie_stations2`";
        // Execute SQL query
        $stmt = $conn->query($sql);
        //Prepare an array to push all the results from the query
        $results = array();
        // Processing...
        while($data = $stmt->fetch()) {
            $results[] = $data; 
        } 
        // returns JSON object to javascript with our array
        return $this->json(['code' => 200, 'results' => json_encode($results)], 200);
    
    }

    /**
     * @Route("/api/search", name="map_api_search")
     */
    public function search(Connection $connection, Request $request, ObjectManager $manager) : Response {

        if($ajaxRequest = $request->getContent())
        {
            $requestContent = json_decode($ajaxRequest, true);

            $content = $requestContent["content"];

            $config = new \Doctrine\DBAL\Configuration();

            $connectionParams = [
                'dbname' => 'smartport',
                'user' => 'root',
                'password' => '',
                'host' => '127.0.0.1:3306',
                'driver' => 'pdo_mysql',
            ];

            $conn = \Doctrine\DBAL\DriverManager::getConnection($connectionParams, $config);

            // Prepare the query
            $sql = "SELECT nom, lon, lat, id FROM `chimie_stations2` WHERE nom LIKE '%$content%' OR id LIKE '%$content%'";
            // Execute SQL query
            $stmt = $conn->query($sql);
            //Prepare an array to push all the results from the query
            $results = array();
            // Processing...
            while($data = $stmt->fetch()) {
                $results[] = $data; 
            } 

            if(($results)) {
                return new JsonResponse([
                    'result' => true,
                    'results' => json_encode($results),
                    ]);
            } else {
                return new JsonResponse([
                    'result' => false,
                ]);
            }
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



