<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Request;

class SmartPortController extends AbstractController
{
    /**
    *@Route("/", name="smart_port")
    */
    public function index()
    {
        $cnx = $this->getDoctrine()->getConnection();
        if ($cnx->isConnected()){
            echo "<script>alert('Connected')</script>";
        }
        else {
            echo "<script>alert('NOT Connected')</script>";
        }

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
        $db = new \PDO('mysql:host=vmli-bdd;dbname=mesmod', 'etude', 'etude');
        $db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
                
        // Prepare the query
        $sql = $db->prepare("SELECT `id`, `lon` ,`lat` FROM `chimie_stations_2`");
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
        return $this->json(['code' => 200, 'message' => json_encode($results)], 200);
    }

}



