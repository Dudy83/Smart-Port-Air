<?php

namespace App\Controller;

use Doctrine\DBAL\Driver\Connection;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\Common\Persistence\ObjectManager;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
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
    public function map()
    {
        return $this->render('smart_port/map.html.twig');
    }


    /**
    *@Route("/api/map", name="mapAPI")
    */
    public function mapAPI(Request $request) : Response
    {  
        // Create connection
        $db = new \PDO('mysql:host=127.0.0.1;dbname=smartport', 'root', '');
        $db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
                
        // Prepare the query
        $sql = $db->prepare("SELECT nom, lon, lat, id FROM `chimie_stations2` WHERE aasqa = 'PACA'");
        // Execute SQL query
        $sql->execute();
        //Prepare an array to push all the results from the query
        $results = array();
        // Processing...
        while($data = $sql->fetch())
        {
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

            $db = new \PDO('mysql:host=127.0.0.1;dbname=smartport', 'root', '');
            $db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
                    
            // Prepare the query
            $sql = $db->prepare("SELECT nom, lon, lat, id FROM `chimie_stations2` WHERE nom LIKE '%$content%' AND aasqa = 'PACA'");
            // Execute SQL query
            $sql->execute();
            //Prepare an array to push all the results from the query
            $results = array();
            // Processing...
            while($data = $sql->fetch())
            {
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
}



