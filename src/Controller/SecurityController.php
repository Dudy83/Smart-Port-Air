<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Annotation\Route;
use App\Entity\User;
use App\Form\RegistrationType;
use Symfony\Component\HttpFoundation\Request;
use Doctrine\Common\Persistence\ObjectManager;
use Symfony\Component\Security\Core\Encoder\UserPasswordEncoderInterface;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\HttpFoundation\Session\Session;
use App\Repository\UserRepository;

class SecurityController extends AbstractController
{
    /**
     * @Route("/inscription", name="security_registration")
     */
    public function registration(ObjectManager $manager, Request $request, UserPasswordEncoderInterface $encoder)
    {
        $user = new User;

        $form = $this->createForm(RegistrationType::class, $user);

        $form->handleRequest($request);

        if($form->isSubmitted() && $form->isValid())
        {
            $hash = $encoder->encodePassword($user, $user->getPassword());

            $user->setPassword($hash);

            $manager->persist($user);

            $manager->flush();

            return $this->redirectToRoute('security_login');
        }

        return $this->render('security/registration.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
     * @Route("/connexion", name="security_login")
     */
    public function login(AuthenticationUtils $authenticationUtils)
    {
        $error = $authenticationUtils->getLastAuthenticationError();

        return $this->render('security/login.html.twig', [
            'error' => $error
        ]);
    }

    /**
     * @Route("/logout", name="security_logout")
     */
    public function logout(){}

    /**
    * @Route("/edition", name="security_modify")
    */
    public function account_modify(Request $request, ObjectManager $manager, UserPasswordEncoderInterface $encoder) {
        
        $user = $this->getUser();
        
        $form = $this->createFormBuilder($user)
                        ->add('email', EmailType::class)
                        ->add('username')
                        ->add('password', PasswordType::class)
                        ->add('confirm_password', PasswordType::class)
                        ->getForm();

        $form->handleRequest($request);
        
        if($form->isSubmitted() && $form->isValid())
        {  
            $hash = $encoder->encodePassword($user, $user->getPassword());
            
            $user->setPassword($hash);
            
            $manager->persist($user);
            
            $manager->flush();
            
            return $this->redirectToRoute('profil'); 
        }

        return $this->render('security/modify.html.twig', [
            'form' => $form->createView(),
        ]);
    }

    /**
    * @Route("/delete-user", name="security_delete_user") 
    */
    public function deleteUser(UserRepository $repo, ObjectManager $manager)
    {
        $user = $this->getUser();
        
        $userId = $user->getId();

        $deleteUser = $repo->find($userId);

        $session = $this->get('session');

        $session = new Session();

        $session->invalidate();
        
        $manager->remove($deleteUser);
        
        $manager->flush();

        return $this->redirectToRoute('smart_port');
    }
}
