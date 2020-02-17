<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;


/**
 * @ORM\Entity(repositoryClass="App\Repository\UserMesuresRepository")
 */
class UserMesures
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $polluant;

        /**
     * @ORM\Column(type="string", length=255)
     */
    private $username;


    /**
     * @ORM\Column(type="datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="float")
     *  @Assert\Type(
     *     type="float",
     *     message="Longitude"
     * )
     */
    private $lon;

    /**
     * @ORM\Column(type="float")
     *     @Assert\Type(
     *     type="float",
     *     message="Latitude"
     * )
     */
    private $lat;

    /**
     * @ORM\Column(type="string", length=255)
     *     @Assert\File(
     *     maxSize = "5000K",
     *     mimeTypes = {"application/json", "text/plain"},
     *     mimeTypesMessage = "fichier JSON"
     * )
     */
    private $file_adress;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPolluant(): ?string
    {
        return $this->polluant;
    }

    public function setPolluant(string $polluant): self
    {
        $this->polluant = $polluant;

        return $this;
    }

    public function getDate()
    {
        return $this->date;
    }

    public function setDate($date)
    {
        $this->date = $date;

        return $this;
    }

    public function getLon(): ?float
    {
        return $this->lon;
    }

    public function setLon(float $lon): self
    {
        $this->lon = $lon;

        return $this;
    }

    public function getLat(): ?float
    {
        return $this->lat;
    }

    public function setLat(float $lat): self
    {
        $this->lat = $lat;

        return $this;
    }

    public function getFileAdress(): ?string
    {
        return $this->file_adress;
    }

    public function setFileAdress(string $file_adress): self
    {
        $this->file_adress = $file_adress;

        return $this;
    }

    public function getUsername(): ?string
    {
        return $this->username;
    }

    public function setUsername(string $username): self
    {
        $this->username = $username;

        return $this;
    }
}
