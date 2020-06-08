<?php

namespace App\Repository;

use App\Entity\UserMesures;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Common\Persistence\ManagerRegistry;

/**
 * @method UserMesures|null find($id, $lockMode = null, $lockVersion = null)
 * @method UserMesures|null findOneBy(array $criteria, array $orderBy = null)
 * @method UserMesures[]    findAll()
 * @method UserMesures[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UserMesuresRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserMesures::class);
    }

    // /**
    //  * @return UserMesures[] Returns an array of UserMesures objects
    //  */
    /*
    public function findByExampleField($value)
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.exampleField = :val')
            ->setParameter('val', $value)
            ->orderBy('u.id', 'ASC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult()
        ;
    }
    */

    /*
    public function findOneBySomeField($value): ?UserMesures
    {
        return $this->createQueryBuilder('u')
            ->andWhere('u.exampleField = :val')
            ->setParameter('val', $value)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
    */
}
