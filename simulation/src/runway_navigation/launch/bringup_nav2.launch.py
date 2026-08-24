import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, GroupAction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PythonExpression
from launch.conditions import IfCondition, UnlessCondition
from launch_ros.actions import Node

def generate_launch_description():
    pkg_nav = get_package_share_directory('runway_navigation')

    world_name = LaunchConfiguration('world_name', default='airport_runway')
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')
    map_yaml_file = LaunchConfiguration(
        'map',
        default=PythonExpression([
            "'", pkg_nav, "/maps/nus_ea_field.yaml' if '", world_name, "' == 'nus_ea_field' else '", pkg_nav, "/maps/runway_map.yaml'"
        ])
    )
    params_file = LaunchConfiguration('params_file', default=os.path.join(pkg_nav, 'config', 'nav2_params.yaml'))
    use_rviz = LaunchConfiguration('use_rviz', default='true')
    rviz_config_file = LaunchConfiguration('rviz_config', default=os.path.join(pkg_nav, 'rviz', 'runway_nav2.rviz'))
    autostart = LaunchConfiguration('autostart', default='true')
    use_amcl = LaunchConfiguration('use_amcl', default='false')

    tf_x = PythonExpression(["'-25.0' if '", world_name, "' == 'nus_ea_field' else '0'"])
    tf_y = PythonExpression(["'0.0' if '", world_name, "' == 'nus_ea_field' else '0'"])
    tf_yaw = PythonExpression(["'0.0' if '", world_name, "' == 'nus_ea_field' else '2.9142'"])

    remappings = [('/tf', 'tf'), ('/tf_static', 'tf_static')]

    # 1. Map Server Node
    map_server_node = Node(
        package='nav2_map_server',
        executable='map_server',
        name='map_server',
        output='screen',
        parameters=[
            params_file,
            {'yaml_filename': map_yaml_file, 'use_sim_time': use_sim_time}
        ],
        remappings=remappings
    )

    # 2a. Static Transform Publisher (map -> odom) for outdoor navigation
    static_tf_map_odom = Node(
        package='tf2_ros',
        executable='static_transform_publisher',
        name='map_to_odom_publisher',
        arguments=['--x', tf_x, '--y', tf_y, '--z', '0',
                   '--yaw', tf_yaw, '--pitch', '0', '--roll', '0',
                   '--frame-id', 'map',
                   '--child-frame-id', 'odom'],
        parameters=[{'use_sim_time': use_sim_time}],
        condition=UnlessCondition(use_amcl),
        output='screen'
    )

    # 2b. AMCL Node (Optional when testing indoor/walled particle filter)
    amcl_node = Node(
        package='nav2_amcl',
        executable='amcl',
        name='amcl',
        output='screen',
        parameters=[
            params_file,
            {'use_sim_time': use_sim_time}
        ],
        remappings=remappings,
        condition=IfCondition(use_amcl)
    )

    # 3a. Lifecycle Manager for Static Map Localization (Default)
    lifecycle_manager_static = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='lifecycle_manager_localization',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'autostart': autostart},
            {'node_names': ['map_server']},
            {'bond_timeout': 0.0}
        ],
        condition=UnlessCondition(use_amcl)
    )

    # 3b. Lifecycle Manager with AMCL (when use_amcl:=true)
    lifecycle_manager_amcl = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='lifecycle_manager_localization',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'autostart': autostart},
            {'node_names': ['map_server', 'amcl']},
            {'bond_timeout': 0.0}
        ],
        condition=IfCondition(use_amcl)
    )

    # 4. Navigation Stack (Controller, Planner, Behaviors, BT Navigator, Smoother, Collision Monitor)
    navigation_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav, 'launch', 'runway_navigation_launch.py')
        ),
        launch_arguments={
            'use_sim_time': use_sim_time,
            'params_file': params_file,
            'autostart': autostart,
            'use_composition': 'False',
        }.items()
    )



    # 6. RViz2 visualization with Runway Nav2 view
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', rviz_config_file],
        parameters=[{'use_sim_time': use_sim_time}],
        condition=IfCondition(use_rviz),
        output='screen'
    )

    return LaunchDescription([
        DeclareLaunchArgument('world_name', default_value='airport_runway', description='World name: airport_runway or nus_ea_field'),
        DeclareLaunchArgument('use_sim_time', default_value='true', description='Use simulation clock'),
        DeclareLaunchArgument('map', default_value=map_yaml_file, description='Full path to map yaml file'),
        DeclareLaunchArgument('params_file', default_value=params_file, description='Full path to nav2 param file'),
        DeclareLaunchArgument('use_rviz', default_value='true', description='Launch RViz with Nav2 Runway view'),
        DeclareLaunchArgument('rviz_config', default_value=rviz_config_file, description='Full path to RViz config file'),
        DeclareLaunchArgument('autostart', default_value='true', description='Automatically startup the nav2 stack'),
        DeclareLaunchArgument('use_amcl', default_value='false', description='Use AMCL particle filter instead of static map transform'),
        map_server_node,
        static_tf_map_odom,
        amcl_node,
        lifecycle_manager_static,
        lifecycle_manager_amcl,
        navigation_launch,
        rviz_node,
    ])
