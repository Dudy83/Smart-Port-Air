<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;

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
    *@Route("/test", name="test")
    */
    public function test()
    {
        return $this->render('smart_port/test.html.twig');
    }
}
